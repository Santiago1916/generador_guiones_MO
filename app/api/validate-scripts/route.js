import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const LANGUAGETOOL_URL = "https://api.languagetool.org/v2/check";
const MAX_SCRIPT_LENGTH = 18_000;

const requestSchema = z.object({
  videos: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        title: z.string().trim().min(1).max(200),
        scriptText: z.string().trim().min(40).max(MAX_SCRIPT_LENGTH),
      })
    )
    .min(1)
    .max(12),
  customDictionary: z.array(z.string().trim().min(1).max(120)).max(300).optional(),
  ignoredIssues: z
    .array(
      z.object({
        videoId: z.string().trim().min(1).max(80),
        issueKeys: z.array(z.string().trim().min(1).max(320)).max(120),
      })
    )
    .max(40)
    .optional(),
});

function compactText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function buildContextSnippet(text = "", index = 0, length = 1) {
  const start = Math.max(0, index - 36);
  const end = Math.min(text.length, index + length + 36);
  return compactText(text.slice(start, end));
}

function normalizeDictionaryEntry(value = "") {
  return compactText(String(value)).toLocaleLowerCase("es");
}

function getIssueSeverity(issue = {}) {
  if (issue.source === "service") {
    return {
      severity: "blocking",
      blocksDownload: true,
    };
  }

  if (issue.source === "local" && issue.message.includes("frase muy larga")) {
    return {
      severity: "suggested",
      blocksDownload: false,
    };
  }

  const issueType = issue.issueType || "";

  if (issueType === "grammar" || issueType === "misspelling") {
    return {
      severity: "blocking",
      blocksDownload: true,
    };
  }

  if (issueType === "typographical" || issueType === "duplication" || issueType === "whitespace") {
    return {
      severity: "important",
      blocksDownload: true,
    };
  }

  if (issueType === "inconsistency") {
    return {
      severity: "suggested",
      blocksDownload: false,
    };
  }

  if (
    issue.message.includes("signos de puntuacion repetidos") ||
    issue.message.includes("espacio antes de un signo") ||
    issue.message.includes("Falta un espacio despues")
  ) {
    return {
      severity: "important",
      blocksDownload: true,
    };
  }

  return {
    severity: "suggested",
    blocksDownload: false,
  };
}

function buildIssueKey(issue = {}) {
  return [
    issue.source || "",
    issue.ruleId || issue.issueType || "",
    issue.message || "",
    Number.isFinite(issue.offset) ? issue.offset : "",
    Number.isFinite(issue.length) ? issue.length : "",
    compactText(issue.matchText || issue.context || ""),
  ].join("::");
}

function extractDictionaryCandidate(issue = {}) {
  const baseValue = compactText(issue.matchText || "");
  if (!baseValue) return "";

  const cleaned = baseValue.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  if (!cleaned) return "";

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 3) return "";

  return words.join(" ").slice(0, 120);
}

function enrichIssue(issue = {}) {
  const dictionaryCandidate = extractDictionaryCandidate(issue);
  const severityState = getIssueSeverity(issue);

  return {
    ...issue,
    ...severityState,
    issueKey: buildIssueKey(issue),
    dictionaryCandidate,
  };
}

function pushRegexIssues({ text, regex, message, issues, max = 3, buildSuggestions, lengthResolver }) {
  regex.lastIndex = 0;
  let match = regex.exec(text);

  while (match && issues.length < max) {
    const index = match.index ?? 0;
    const length = typeof lengthResolver === "function" ? lengthResolver(match) : match[0]?.length || 1;
    const suggestions = typeof buildSuggestions === "function" ? buildSuggestions(match) : [];

    issues.push({
      source: "local",
      message,
      context: buildContextSnippet(text, index, length),
      suggestions,
      offset: index,
      length,
      matchText: match[0] || "",
    });

    match = regex.exec(text);
  }
}

function collectLocalWritingIssues(text = "") {
  const issues = [];

  pushRegexIssues({
    text,
    regex: / {2,}/g,
    message: "Hay espacios dobles que conviene corregir para mejorar la lectura.",
    issues,
    buildSuggestions: () => [" "],
  });

  pushRegexIssues({
    text,
    regex: /\s+[,.;:!?]/g,
    message: "Se encontro un espacio antes de un signo de puntuacion.",
    issues,
    buildSuggestions: (match) => [match[0].replace(/\s+([,.;:!?])/g, "$1")],
  });

  pushRegexIssues({
    text,
    regex: /([,.;:!?])([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g,
    message: "Falta un espacio despues de un signo de puntuacion.",
    issues,
    buildSuggestions: (match) => [`${match[1]} ${match[2]}`],
    lengthResolver: () => 2,
  });

  pushRegexIssues({
    text,
    regex: /([!?.,;:])\1{1,}/g,
    message: "Hay signos de puntuacion repetidos que deberian revisarse.",
    issues,
    buildSuggestions: (match) => [match[1]],
  });

  const longSentences = compactText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => sentence.split(/\s+/).filter(Boolean).length > 45)
    .slice(0, 2);

  for (const sentence of longSentences) {
    const offset = text.indexOf(sentence);
    issues.push({
      source: "local",
      message: "Hay una frase muy larga. Conviene dividirla para que el guion suene mas natural.",
      context: sentence,
      suggestions: [],
      offset: offset >= 0 ? offset : null,
      length: sentence.length,
      matchText: sentence,
    });
  }

  return issues;
}

function mapLanguageToolMatches(sourceText = "", matches = []) {
  const relevantIssueTypes = new Set([
    "misspelling",
    "typographical",
    "grammar",
    "duplication",
    "whitespace",
    "inconsistency",
  ]);

  return matches
    .filter((match) => {
      const issueType = match?.rule?.issueType || "";
      return relevantIssueTypes.has(issueType);
    })
    .slice(0, 12)
    .map((match) =>
      enrichIssue({
        source: "languagetool",
        message: match.message || "Se encontro una observacion ortografica o gramatical.",
        context: compactText(match.context?.text || ""),
        suggestions: Array.isArray(match.replacements)
          ? match.replacements
              .slice(0, 4)
              .map((replacement) => replacement?.value)
              .filter(Boolean)
          : [],
        offset: Number.isFinite(match.offset) ? match.offset : null,
        length: Number.isFinite(match.length) ? match.length : null,
        matchText:
          Number.isFinite(match.offset) && Number.isFinite(match.length)
            ? String(sourceText).slice(match.offset, match.offset + match.length)
            : "",
        ruleId: match.rule?.id || "",
        issueType: match.rule?.issueType || "",
      })
    );
}

async function validateWithLanguageTool(text = "") {
  const body = new URLSearchParams({
    language: "es",
    text,
  });

  const response = await fetch(LANGUAGETOOL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error("La revision ortografica externa no respondio correctamente.");
  }

  const payload = await response.json();
  return mapLanguageToolMatches(text, payload?.matches || []);
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const parsed = requestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "La solicitud de validacion no es valida.",
        },
        { status: 400 }
      );
    }

    let serviceAvailable = true;
    const customDictionarySet = new Set((parsed.data.customDictionary || []).map(normalizeDictionaryEntry));
    const ignoredIssuesMap = new Map(
      (parsed.data.ignoredIssues || []).map((entry) => [entry.videoId, new Set(entry.issueKeys)])
    );

    const reviewedVideos = await Promise.all(
      parsed.data.videos.map(async (video) => {
        const localIssues = collectLocalWritingIssues(video.scriptText).map(enrichIssue);
        let orthographyIssues = [];

        try {
          orthographyIssues = await validateWithLanguageTool(video.scriptText);
        } catch {
          serviceAvailable = false;
        }

        let issues = [...localIssues, ...orthographyIssues];

        if (!serviceAvailable && orthographyIssues.length === 0) {
          issues.unshift(
            enrichIssue({
              source: "service",
              message:
                "No fue posible completar la revision ortografica externa. Intenta nuevamente antes de descargar el PDF.",
              context: "",
              suggestions: [],
              offset: null,
              length: null,
              matchText: "",
            })
          );
        }

        const ignoredIssueKeys = ignoredIssuesMap.get(video.id) || new Set();
        issues = issues.filter((issue) => {
          if (ignoredIssueKeys.has(issue.issueKey)) return false;

          if (issue.dictionaryCandidate) {
            const normalizedCandidate = normalizeDictionaryEntry(issue.dictionaryCandidate);
            if (normalizedCandidate && customDictionarySet.has(normalizedCandidate)) {
              return false;
            }
          }

          return true;
        });

        return {
          id: video.id,
          title: video.title,
          passed: issues.every((issue) => !issue.blocksDownload),
          issueCount: issues.length,
          blockingIssueCount: issues.filter((issue) => issue.blocksDownload).length,
          issues,
        };
      })
    );

    const passed = reviewedVideos.every((video) => video.passed);

    return NextResponse.json({
      passed,
      serviceAvailable,
      provider: "LanguageTool Public API + reglas locales de escritura",
      videos: reviewedVideos,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "No fue posible validar la escritura de los guiones.",
      },
      { status: 500 }
    );
  }
}
