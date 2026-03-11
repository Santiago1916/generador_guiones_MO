"use client";

import { useEffect, useState } from "react";
import { normalizeCourseCategoryId } from "@/lib/course-categories";
import { normalizeDictionaryEntry } from "@/lib/script-generator";

const CUSTOM_DICTIONARY_STORAGE_KEY = "mo-script-generator-custom-dictionary";
const COURSE_TYPE_STORAGE_KEY = "mo-script-generator-course-type";

export function useLocalDrafts() {
  const [customDictionary, setCustomDictionary] = useState([]);
  const [selectedCourseType, setSelectedCourseType] = useState("auto");

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedDictionary = JSON.parse(window.localStorage.getItem(CUSTOM_DICTIONARY_STORAGE_KEY) || "[]");
      if (Array.isArray(storedDictionary)) {
        setCustomDictionary(
          storedDictionary
            .map((entry) => normalizeDictionaryEntry(entry))
            .filter(Boolean)
            .slice(0, 300)
        );
      }
    } catch {
      window.localStorage.removeItem(CUSTOM_DICTIONARY_STORAGE_KEY);
    }

    setSelectedCourseType(normalizeCourseCategoryId(window.localStorage.getItem(COURSE_TYPE_STORAGE_KEY) || "auto"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CUSTOM_DICTIONARY_STORAGE_KEY, JSON.stringify(customDictionary));
  }, [customDictionary]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COURSE_TYPE_STORAGE_KEY, selectedCourseType);
  }, [selectedCourseType]);

  return {
    customDictionary,
    setCustomDictionary,
    selectedCourseType,
    setSelectedCourseType,
  };
}
