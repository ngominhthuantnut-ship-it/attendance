import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const TEACHER_EMAIL = "ngominhthuan.tnut@gmail.com";
const TEACHER_UID = "teacher-uid-1";
const OTHER_UID = "other-uid";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "attendance-fa916-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

function teacherDb() {
  return env
    .authenticatedContext(TEACHER_UID, { email: TEACHER_EMAIL, email_verified: true })
    .firestore();
}

function otherDb() {
  return env
    .authenticatedContext(OTHER_UID, { email: "intruder@example.com", email_verified: true })
    .firestore();
}

function anonDb() {
  return env.unauthenticatedContext().firestore();
}

async function seedConfig() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "meta/config"), {
      teacherUid: TEACHER_UID,
      teacherEmail: TEACHER_EMAIL,
      teacherName: "Test Teacher",
    });
  });
}

describe("bootstrap", () => {
  it("allows the teacher email to create meta/config when missing", async () => {
    await assertSucceeds(
      setDoc(doc(teacherDb(), "meta/config"), {
        teacherUid: TEACHER_UID,
        teacherEmail: TEACHER_EMAIL,
        teacherName: "Test Teacher",
      }),
    );
  });

  it("denies bootstrap from other emails", async () => {
    await assertFails(
      setDoc(doc(otherDb(), "meta/config"), {
        teacherUid: OTHER_UID,
        teacherEmail: "other@example.com",
        teacherName: "Intruder",
      }),
    );
  });

  it("denies bootstrap from anonymous", async () => {
    await assertFails(
      setDoc(doc(anonDb(), "meta/config"), {
        teacherUid: "anon-uid",
        teacherEmail: TEACHER_EMAIL,
        teacherName: "Intruder",
      }),
    );
  });

  it("denies second bootstrap once config exists", async () => {
    await seedConfig();
    await assertFails(
      setDoc(doc(otherDb(), "meta/config"), {
        teacherUid: OTHER_UID,
        teacherEmail: TEACHER_EMAIL,
        teacherName: "Replace",
      }),
    );
  });

  it("denies updating teacherUid even by teacher", async () => {
    await seedConfig();
    await assertFails(
      setDoc(doc(teacherDb(), "meta/config"), {
        teacherUid: "different-uid",
        teacherEmail: TEACHER_EMAIL,
        teacherName: "Hijack",
      }),
    );
  });
});

describe("classes", () => {
  beforeEach(async () => seedConfig());

  it("teacher creates a class", async () => {
    await assertSucceeds(setDoc(doc(teacherDb(), "classes/c1"), { name: "Toán" }));
  });

  it("non-teacher cannot create", async () => {
    await assertFails(setDoc(doc(otherDb(), "classes/c1"), { name: "Toán" }));
  });

  it("anon cannot list classes", async () => {
    await assertFails(getDocs(collection(anonDb(), "classes")));
  });

  it("anon can get a class by ID", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "classes/c1"), { name: "Toán" });
    });
    await assertSucceeds(getDoc(doc(anonDb(), "classes/c1")));
  });
});

describe("students + months", () => {
  beforeEach(async () => seedConfig());

  it("teacher writes student & month", async () => {
    await assertSucceeds(setDoc(doc(teacherDb(), "students/s1"), { name: "An" }));
    await assertSucceeds(
      setDoc(doc(teacherDb(), "students/s1/months/2026-06"), { month: "2026-06" }),
    );
  });

  it("anon can get student & month by ID", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "students/s1"), { name: "An" });
      await setDoc(doc(ctx.firestore(), "students/s1/months/2026-06"), { month: "2026-06" });
    });
    await assertSucceeds(getDoc(doc(anonDb(), "students/s1")));
    await assertSucceeds(getDoc(doc(anonDb(), "students/s1/months/2026-06")));
  });

  it("anon cannot list students or months", async () => {
    await assertFails(getDocs(collection(anonDb(), "students")));
    await assertFails(getDocs(collection(anonDb(), "students/s1/months")));
  });

  it("anon cannot write", async () => {
    await assertFails(setDoc(doc(anonDb(), "students/s1"), { name: "Mal" }));
    await assertFails(
      setDoc(doc(anonDb(), "students/s1/months/2026-06"), { hacked: true }),
    );
  });
});

describe("parentLinks", () => {
  beforeEach(async () => seedConfig());

  it("teacher creates token", async () => {
    await assertSucceeds(
      setDoc(doc(teacherDb(), "parentLinks/tok-abc"), { studentId: "s1", classId: "c1" }),
    );
  });

  it("anon gets by token", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "parentLinks/tok-abc"), {
        studentId: "s1",
        classId: "c1",
      });
    });
    await assertSucceeds(getDoc(doc(anonDb(), "parentLinks/tok-abc")));
  });

  it("anon cannot list parentLinks", async () => {
    await assertFails(getDocs(collection(anonDb(), "parentLinks")));
  });
});
