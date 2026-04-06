import { create } from "zustand"

const STORAGE_KEY = "onboarding-v1-complete"

export interface OnboardingStep {
  id: string
  /** CSS selector for the element to spotlight. Undefined = full dark overlay (welcome card). */
  selector?: string
  title: string
  body: string
  /** Preferred tooltip placement. Defaults to auto (more available space wins). */
  position?: "above" | "below"
  /** Navigate to this path before showing the step. */
  requiresPath?: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to TM111 Quiz",
    body: "This quick tour covers the key features. Tap Next, or tap anywhere on the dark area to continue. Skip it any time.",
  },
  {
    id: "block-first",
    selector: "[data-onboarding='block-first']",
    title: "Pick a study block",
    body: "Each block maps to a different part of your course material. Tap a block to see its topics, then start a focused quiz.",
    position: "below",
    requiresPath: "/",
  },
  {
    id: "mixed-quiz",
    selector: "[data-onboarding='mixed-quiz']",
    title: "Mixed Quiz",
    body: "Jump straight into questions drawn from every topic at once. Great for broad revision sessions.",
    position: "above",
    requiresPath: "/",
  },
  {
    id: "nav-progress",
    selector: "[data-onboarding='nav-progress']",
    title: "Your progress",
    body: "See per-topic scores and accuracy over time. Once a block reaches 90% accuracy, you unlock the ability to generate fresh AI questions for it.",
    position: "above",
  },
  {
    id: "gen-questions",
    selector: "[data-onboarding='gen-questions']",
    title: "Generate new questions",
    body: "Hit 90% accuracy on any block or topic to unlock this button. The AI generates 10 new questions tailored to that area. There is a 7-day cooldown per topic after each generation.",
    position: "above",
    requiresPath: "/progress",
  },
  {
    id: "nav-alerts",
    selector: "[data-onboarding='nav-alerts']",
    title: "Notifications",
    body: "New questions, app updates, and study milestones all appear here. Tap to see the full list.",
    position: "above",
  },
  {
    id: "nav-profile",
    selector: "[data-onboarding='nav-profile']",
    title: "Profile and settings",
    body: "Switch dark and light mode, go to settings, or sign out from this menu.",
    position: "above",
  },
  {
    id: "question-mode",
    selector: "[data-onboarding='question-mode']",
    title: "Question delivery mode",
    body: "Controls which questions are picked when you start a quiz. Spaced repetition and weak-first modes focus your time where it is needed most, helping you reach the 90% threshold faster.",
    position: "below",
    requiresPath: "/settings",
  },
  {
    id: "strictness",
    selector: "[data-onboarding='strictness']",
    title: "AI marking strictness",
    body: "Open-answer questions are marked by AI. Strict mode requires precise answers and reflects your real understanding more accurately. A higher real accuracy score means AI-generated questions unlock sooner.",
    position: "above",
    requiresPath: "/settings",
  },
]

interface OnboardingStore {
  isActive: boolean
  step: number
  start: () => void
  restart: () => void
  next: () => void
  prev: () => void
  skip: () => void
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  isActive: false,
  step: 0,

  start: () => {
    if (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) return
    set({ isActive: true, step: 0 })
  },

  restart: () => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY)
    set({ isActive: true, step: 0 })
  },

  next: () => {
    const { step } = get()
    if (step < ONBOARDING_STEPS.length - 1) {
      set({ step: step + 1 })
    } else {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, "1")
      set({ isActive: false, step: 0 })
    }
  },

  prev: () => {
    const { step } = get()
    if (step > 0) set({ step: step - 1 })
  },

  skip: () => {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, "1")
    set({ isActive: false, step: 0 })
  },
}))
