export type Difficulty = "Foundational" | "Intermediate" | "Advanced";

export type Question = {
  slug: string;
  title: string;
  topic: string;
  category: string;
  difficulty: Difficulty;
  tags: string[];
  shortAnswer: string;
  explanation: string;
  code: string;
  followUps: string[];
};

export const questions: Question[] = [
  {
    slug: "closures",
    title: "What is a closure in JavaScript?",
    topic: "JavaScript",
    category: "Fundamentals",
    difficulty: "Foundational",
    tags: ["scope", "functions", "memory"],
    shortAnswer: "A closure is a function together with access to the variables from its lexical scope, even after the outer function has returned.",
    explanation: "JavaScript functions retain references to variables in the scope where they were created. This enables private state, callbacks, and function factories. The closure keeps the referenced environment reachable for as long as the inner function can be called.",
    code: `function createCounter() {
  let count = 0;

  return function increment() {
    count += 1;
    return count;
  };
}

const nextCount = createCounter();
nextCount(); // 1
nextCount(); // 2`,
    followUps: ["How does lexical scope differ from dynamic scope?", "When can a closure contribute to a memory leak?"],
  },
  {
    slug: "event-loop",
    title: "How does the JavaScript event loop work?",
    topic: "JavaScript",
    category: "Asynchronous JavaScript",
    difficulty: "Intermediate",
    tags: ["event-loop", "promises", "tasks"],
    shortAnswer: "The event loop coordinates the call stack with task and microtask queues so JavaScript can handle asynchronous work without blocking the main thread.",
    explanation: "Synchronous code runs on the call stack. Promise callbacks are placed in the microtask queue, while timers and many browser events use task queues. After the current stack is empty, the runtime drains microtasks before taking the next task.",
    code: `console.log("A");

setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));

console.log("D");
// A, D, C, B`,
    followUps: ["Why do microtasks run before the next timer?", "How can long synchronous work affect user input?"],
  },
];

export function getQuestion(slug: string) {
  return questions.find((question) => question.slug === slug);
}

export function getTopics() {
  return [...new Set(questions.map((question) => question.topic))];
}

export function getQuestionsForTopic(topic: string) {
  return questions.filter((question) => question.topic.toLowerCase() === topic.toLowerCase());
}