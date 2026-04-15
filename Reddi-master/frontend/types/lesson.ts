export type Lesson = {
  id: number;
  created_at?: string;
  date?: string // ISO string "2026-03-12"
  title: string;
  subject: string;
  grade: number;
  duration: number;
  template: string;
  description: string;
  activityCount: number;
};

export type Payload = {
  lesson: Lesson;
  activities: Activity[];
}

export type ActivityType =
  | "Samtalebilde"
  | "Oppgaver"
  | "Forklaringsvideo";

export type ActivityMode = "Helklasse" | "Grupper" | "Individuelt";


export interface BaseActivity {
  id: string;
  type: ActivityType;
  mode: ActivityMode;
  duration: number;   //minutes
  position: number;
}


export interface ActivityWithVariantsBase<TContent> extends BaseActivity {
  variants: TContent[];
  selected_variant_index: number;
}

/* ---------- Samtalebilde ---------- */

export interface SamtalebildeActivity extends ActivityWithVariantsBase<SamtalebildeContent> {
  type: "Samtalebilde";
  image: SamtalebildeContent["image"];
  questions: string[];
}


/* ---------- Oppgaver ---------- */

export interface Oppgave {
  question: string;
  difficulty: "Lett" | "Middels" | "Vanskelig";
  answer?: string;
  page_start?: number;
  page_end?: number;
}

export interface OppgaverActivity extends ActivityWithVariantsBase<OppgaverContent> {
  type: "Oppgaver";
  tasks: Oppgave[];
}

/* ---------- Forklaringsvideo ---------- */

export interface ForklaringsvideoActivity extends ActivityWithVariantsBase<ForklaringsvideoContent> {
  type: "Forklaringsvideo"
  video_url: string;
}

/* ───────────────────────────── */
/* Union of all activities       */
/* ───────────────────────────── */

export type Activity =
  | SamtalebildeActivity
  | OppgaverActivity
  | ForklaringsvideoActivity



export function createActivity(
  type: ActivityType,
  position: number
): Activity {
  switch (type) {
    case "Samtalebilde":
      return {
        id: `${type}-${position}`,
        type,
        mode: "Helklasse",
        duration: 5,
        position,

        variants: [{
          image: { url: "", prompt: ""},
          questions: []}],
          selected_variant_index: 0,

        //Currently selected
        image: { url: "", prompt: ""},
        questions: []
      };

    case "Oppgaver":
      return {
        id: `${type}-${position}`,
        type,
        mode: "Individuelt",
        duration: 15,
        position,

        variants: [{
          tasks: []}],
        selected_variant_index: 0,

        tasks: [{question:"", difficulty: "Lett"}]
      };

    case "Forklaringsvideo":
      return {
        id: `${type}-${position}`,
        type,
        mode: "Helklasse",
        duration: 10,
        position,

        variants: [{
          video_url: ""}],
        selected_variant_index: 0,

        video_url: ""
      };
  }
}






export interface ApiActivityBase {
  id: string;
  type: ActivityType;
  mode: ActivityMode;
  duration: number;
  position: number;
  variants: unknown;
  selected_variant_index: number;
}

//Typed content forms

export interface SamtalebildeContent {
  image: {
    url: string;
    prompt?: string;
    alt?: string;
  };
  questions: string[];
}

export interface OppgaverContent {
  tasks: {
    question: string;
    difficulty: "Lett" | "Middels" | "Vanskelig";
    answer?: string;
    page_start?: number;
    page_end?: number;
  }[];
}

export interface ForklaringsvideoContent {
  video_url: string;
}


export type ApiActivity =
  | (ApiActivityBase & {
      type: "Samtalebilde";
      variants: SamtalebildeContent[];
    })
  | (ApiActivityBase & {
      type: "Oppgaver";
      variants: OppgaverContent[];
    })
  | (ApiActivityBase & {
      type: "Forklaringsvideo";
      variants: ForklaringsvideoContent[];
    });