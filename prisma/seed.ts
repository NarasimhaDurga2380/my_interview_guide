import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const javascriptTopics: Omit<Prisma.TopicCreateWithoutTechInput, "tech">[] = [
  {
    slug: "closures",
    title: "Closures",
    summary:
      "A function bundled with the lexical environment it was created in, which is what makes private state and function factories possible.",
    difficulty: "FOUNDATIONAL",
    position: 0,
    published: true,
    details: [
      {
        heading: "What a closure actually is",
        body: "A closure is the pairing of a function with a reference to its lexical scope. When a function is created, it captures the variable environment it was defined in, not the one it is called from. Because that reference keeps the environment reachable, the variables survive after the outer function has returned.",
        keyPoints: [
          "Scope is decided where a function is written, not where it is called.",
          "The inner function holds a reference to variables, not a copy of their values.",
          "The captured environment stays alive as long as the closure is reachable.",
        ],
      },
      {
        heading: "Why it matters in interviews",
        body: "Closures underpin module privacy, memoisation, debounce and throttle, partial application, and every callback that reads outer state. Most `var` in a loop puzzles and most 'why is this value stale' React questions are closure questions in disguise.",
        keyPoints: [
          "Private state without classes.",
          "Function factories and currying.",
          "Stale-closure bugs in React effects and event handlers.",
        ],
      },
      {
        heading: "Memory considerations",
        body: "A closure keeps its captured scope out of reach of the garbage collector. That is normally harmless, but a long-lived closure that captures a large object, a DOM node, or a subscription will keep it alive forever. Release the reference when the closure is no longer needed.",
        keyPoints: [
          "Long-lived listeners are the most common closure leak.",
          "Capture only what you need, not the whole enclosing object.",
        ],
      },
    ],
    analogy: {
      realWorld:
        "A closure is a backpack. When a function leaves the place it was born, it does not take a photograph of the room; it takes a backpack that still contains the actual items from that room. Anyone holding the function can reach into the backpack, and nobody else can. The room can be demolished and the items still exist, because the backpack is still holding them.",
      genericExample:
        "Imagine a coffee shop loyalty card. The shop hands you a stamping function when you sign up. That function remembers YOUR card, not the shop counter's card. Two customers get two independent stamping functions, each carrying its own card. Neither can see the other's card, and the count survives long after the sign-up conversation ended. Replace 'card' with a variable and 'stamping function' with the returned inner function and you have a closure.",
      code: `function issueLoyaltyCard(customer) {
  let stamps = 0; // lives in the backpack

  return function stamp() {
    stamps += 1;
    return \`\${customer}: \${stamps} stamps\`;
  };
}

const stampAsha = issueLoyaltyCard("Asha");
const stampBen = issueLoyaltyCard("Ben");

stampAsha(); // "Asha: 1 stamps"
stampAsha(); // "Asha: 2 stamps"
stampBen();  // "Ben: 1 stamps"  - independent backpack`,
    },
    questions: {
      create: [
        {
          position: 0,
          question: "What is a closure in JavaScript?",
          shortAnswer:
            "A function together with access to the variables from its lexical scope, retained even after the outer function has returned.",
          explanation:
            "Functions in JavaScript keep a reference to the environment in which they were defined. That reference is the closure. It gives the inner function continued read and write access to the outer variables, which is what enables private state, callbacks that remember context, and function factories.",
          followUps: [
            "How does lexical scope differ from dynamic scope?",
            "Does a closure copy values or reference them?",
          ],
        },
        {
          position: 1,
          question: "Why does a `var` loop with `setTimeout` log the same number every time?",
          shortAnswer:
            "`var` is function-scoped, so all callbacks close over one shared binding that has already reached its final value by the time they run.",
          explanation:
            "With `var` there is a single `i` for the whole function. Every scheduled callback closes over that same binding. The loop finishes synchronously before any timer fires, so each callback reads the final value. `let` creates a fresh binding per iteration, so each callback closes over its own copy.",
          followUps: [
            "How would you fix it without changing `var` to `let`?",
            "What does the JavaScript engine do differently for `let` in a loop?",
          ],
        },
        {
          position: 2,
          question: "When can a closure cause a memory leak?",
          shortAnswer:
            "When a long-lived closure captures something large and is never released, for example an event listener that is never removed.",
          explanation:
            "The captured environment is reachable while the closure is reachable, so the garbage collector cannot free it. A listener attached to a global object that captures a component's entire state, or a cached callback that captures a detached DOM node, will keep that memory alive for the lifetime of the page.",
          followUps: [
            "How would you detect this in Chrome DevTools?",
            "How does removing the listener fix it?",
          ],
        },
        {
          position: 3,
          question: "How do closures create private state?",
          shortAnswer:
            "Variables in the outer function are unreachable from outside; only the returned inner functions can touch them.",
          explanation:
            "This is the module pattern. The factory exposes an object of functions that share one hidden scope. Callers get behaviour but no direct handle on the data, so invariants can be enforced. Class private fields (`#count`) now provide a language-level alternative.",
          followUps: [
            "How does this compare with `#private` class fields?",
            "What is the cost of one closure per instance versus a shared prototype method?",
          ],
        },
        {
          position: 4,
          question: "What is a stale closure in React and how do you avoid it?",
          shortAnswer:
            "A callback captured on an earlier render still sees that render's props and state; fix it with correct dependencies or a functional state update.",
          explanation:
            "Each render creates new function instances closing over that render's values. If an effect or event handler is memoised with a stale dependency array, it keeps reading old values. Passing an updater function to `setState`, or listing the real dependencies, keeps the closure current.",
          followUps: [
            "Why does `setCount(c => c + 1)` avoid the problem?",
            "When is a ref the right escape hatch?",
          ],
        },
      ],
    },
    snippets: {
      create: [
        {
          position: 0,
          title: "Counter factory",
          language: "javascript",
          code: `function createCounter() {
  let count = 0;

  return function increment() {
    count += 1;
    return count;
  };
}

const next = createCounter();
next(); // 1
next(); // 2

const other = createCounter();
other(); // 1 - separate scope`,
          explanation:
            "Each call to `createCounter` produces a fresh scope, so the two counters never interfere. `count` is unreachable from outside.",
          pitfall: "Reusing one counter instance where you meant to create a new one shares state silently.",
        },
        {
          position: 1,
          title: "The classic loop trap",
          language: "javascript",
          code: `for (var i = 0; i < 3; i += 1) {
  setTimeout(() => console.log(i), 0);
}
// 3, 3, 3

for (let j = 0; j < 3; j += 1) {
  setTimeout(() => console.log(j), 0);
}
// 0, 1, 2`,
          explanation:
            "`var` gives one binding shared by all three callbacks. `let` gives a new binding per iteration, so each callback closes over a different variable.",
          pitfall: "Wrapping in an IIFE was the pre-ES6 fix; reaching for it today usually means `let` was the real answer.",
        },
        {
          position: 2,
          title: "Module pattern with private state",
          language: "javascript",
          code: `function createAccount(initialBalance) {
  let balance = initialBalance;

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Amount must be positive");
      balance += amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const account = createAccount(100);
account.deposit(50);   // 150
account.balance;       // undefined - genuinely private`,
          explanation:
            "Both methods share one closure, so they see the same `balance` while callers cannot reach it directly. Invariants are enforced in one place.",
          pitfall: "Every instance allocates its own copies of the methods, unlike prototype methods that are shared.",
        },
        {
          position: 3,
          title: "Debounce",
          language: "javascript",
          code: `function debounce(fn, delay) {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const search = debounce((term) => console.log("searching", term), 300);`,
          explanation:
            "`timeoutId` lives in the closure, so it persists between calls without polluting the outer scope. This is the canonical practical use of a closure.",
          pitfall: "Creating the debounced function inside a render body makes a new one every render, which resets the timer and defeats the debounce.",
        },
        {
          position: 4,
          title: "Closures capture references, not values",
          language: "javascript",
          code: `let message = "first";

function show() {
  console.log(message);
}

message = "second";
show(); // "second"`,
          explanation:
            "The closure holds the binding, not a snapshot. Reassigning the outer variable is visible to the closure.",
          pitfall: "This is exactly why a callback can appear to 'see the future' relative to when it was created.",
        },
      ],
    },
    practiceItems: {
      create: [
        {
          position: 0,
          kind: "PREDICT_OUTPUT",
          difficulty: "FOUNDATIONAL",
          prompt: `function make() {
  let n = 0;
  return () => ++n;
}
const a = make();
const b = make();
console.log(a(), a(), b());`,
          options: [],
          answer: "1 2 1",
          explanation:
            "`a` and `b` come from two separate calls to `make`, so each closes over its own `n`. `a` increments twice, `b` starts fresh.",
        },
        {
          position: 1,
          kind: "MCQ",
          difficulty: "FOUNDATIONAL",
          prompt: "What does a closure capture?",
          options: [
            "A copy of the outer variables at creation time",
            "A reference to the outer variable bindings",
            "Only the parameters of the outer function",
            "The value of `this` at creation time",
          ],
          answer: "A reference to the outer variable bindings",
          explanation:
            "Closures hold live bindings, so later reassignment of an outer variable is visible inside the closure. `this` is not captured by a normal function; only arrow functions inherit it lexically.",
        },
        {
          position: 2,
          kind: "PREDICT_OUTPUT",
          difficulty: "INTERMEDIATE",
          prompt: `const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map(f => f()));`,
          options: [],
          answer: "[3, 3, 3]",
          explanation:
            "`var` creates one binding for the whole loop. By the time the functions run, the loop has finished and `i` is 3. Switching to `let` yields `[0, 1, 2]`.",
        },
        {
          position: 3,
          kind: "MCQ",
          difficulty: "INTERMEDIATE",
          prompt: "Which situation most likely leaks memory through a closure?",
          options: [
            "A factory function called once at startup",
            "A pure function that takes all its inputs as arguments",
            "A global event listener capturing a large object and never removed",
            "An arrow function passed to `Array.prototype.map`",
          ],
          answer: "A global event listener capturing a large object and never removed",
          explanation:
            "The listener is reachable from the global object, so its captured scope, including the large object, can never be collected. Short-lived callbacks like the one passed to `map` become unreachable immediately.",
        },
        {
          position: 4,
          kind: "CODING",
          difficulty: "INTERMEDIATE",
          prompt:
            "Write `once(fn)` that returns a function which invokes `fn` at most once and returns the cached result on every later call.",
          options: [],
          starterCode: `function once(fn) {
  // your code here
}`,
          answer: `function once(fn) {
  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}`,
          explanation:
            "`called` and `result` live in the closure, giving the returned function persistent memory across calls. A separate `called` flag is needed because `fn` may legitimately return `undefined`.",
        },
        {
          position: 5,
          kind: "CODING",
          difficulty: "ADVANCED",
          prompt:
            "Implement `memoize(fn)` for a single-argument function so repeated calls with the same argument skip the work.",
          options: [],
          starterCode: `function memoize(fn) {
  // your code here
}`,
          answer: `function memoize(fn) {
  const cache = new Map();

  return function (arg) {
    if (cache.has(arg)) return cache.get(arg);
    const value = fn.call(this, arg);
    cache.set(arg, value);
    return value;
  };
}`,
          explanation:
            "The `Map` is private to the closure, so each memoised function gets its own cache. Using `cache.has` rather than a truthiness check keeps falsy results cached correctly. Note the unbounded growth: a real implementation needs an eviction policy.",
        },
      ],
    },
  },
  {
    slug: "event-loop",
    title: "Event loop",
    summary:
      "How a single-threaded runtime coordinates the call stack, microtasks, and task queues to stay responsive.",
    difficulty: "INTERMEDIATE",
    position: 1,
    published: true,
    details: [
      {
        heading: "The moving parts",
        body: "JavaScript runs on one call stack. Asynchronous work is handed to the host environment, which pushes completed callbacks onto queues. The event loop repeatedly takes one task, runs it to completion, then fully drains the microtask queue, then lets the browser render.",
        keyPoints: [
          "Call stack: the currently executing synchronous work.",
          "Microtask queue: promise callbacks, `queueMicrotask`, `MutationObserver`.",
          "Task queue: timers, I/O, DOM events, `postMessage`.",
        ],
      },
      {
        heading: "Ordering rules",
        body: "All synchronous code runs first. When the stack empties, the entire microtask queue is drained, including microtasks queued by other microtasks. Only then does the loop pick up the next task. This is why a promise chain always finishes before a `setTimeout(..., 0)` scheduled earlier.",
        keyPoints: [
          "Microtasks starve tasks if they keep queueing more microtasks.",
          "`setTimeout(fn, 0)` is clamped to roughly 4ms after nesting, and is never immediate.",
          "Rendering happens between tasks, never in the middle of one.",
        ],
      },
      {
        heading: "Why responsiveness suffers",
        body: "Because a task runs to completion, a long synchronous loop blocks input handling, animation, and rendering entirely. Breaking work into chunks scheduled as separate tasks, or moving it to a Web Worker, is what keeps the main thread free.",
        keyPoints: [
          "Long tasks are the direct cause of poor Interaction to Next Paint.",
          "Chunking with `setTimeout` or `scheduler.yield` gives the browser a chance to paint.",
          "Workers move CPU-bound work off the main thread entirely.",
        ],
      },
    ],
    analogy: {
      realWorld:
        "The event loop is a single barista. There is one espresso machine, so only one drink is made at a time. Regular orders form a queue. But there is also a small tray of 'finish this now' jobs next to the machine, such as adding the lid and sleeve to the drink just made. The barista always clears that whole tray before calling the next customer, no matter how long the customer queue is.",
      genericExample:
        "The customer queue is the task queue (timers, clicks, network responses). The finish-now tray is the microtask queue (promise callbacks). If the barista takes a huge catering order and works on it without pause, everyone else waits and the shop looks frozen. That is a long task blocking the main thread. And if someone keeps dropping new jobs into the finish-now tray, the barista never gets to the next customer at all. That is microtask starvation.",
      code: `console.log("customer walks in");        // sync

setTimeout(() => console.log("next customer"), 0);   // task queue
Promise.resolve().then(() => console.log("add lid")); // finish-now tray

console.log("hand over drink");          // sync

// customer walks in
// hand over drink
// add lid          <- whole tray cleared first
// next customer`,
    },
    questions: {
      create: [
        {
          position: 0,
          question: "How does the JavaScript event loop work?",
          shortAnswer:
            "It runs one task to completion, drains all microtasks, optionally renders, then picks the next task, repeating forever.",
          explanation:
            "Synchronous code executes on the call stack. Asynchronous callbacks are queued by the host. The loop never interrupts running code; it only picks up new work once the stack is empty. Microtasks have priority over tasks, which is what determines promise versus timer ordering.",
          followUps: [
            "Where does `async`/`await` fit into this model?",
            "What happens if a microtask queues another microtask?",
          ],
        },
        {
          position: 1,
          question: "Why do promise callbacks run before a `setTimeout(fn, 0)` scheduled earlier?",
          shortAnswer:
            "Promise callbacks go on the microtask queue, which is fully drained before the loop takes the next task from the task queue.",
          explanation:
            "The two queues have different priority. After the current task finishes, the loop empties the microtask queue completely. The timer callback is a task and can only run on the following iteration, so it always loses to a promise scheduled in the same turn.",
          followUps: [
            "Can microtasks starve the task queue?",
            "Is `setTimeout(fn, 0)` really zero milliseconds?",
          ],
        },
        {
          position: 2,
          question: "How does `await` interact with the event loop?",
          shortAnswer:
            "`await` suspends the async function and schedules the remainder as a microtask that resumes once the awaited value settles.",
          explanation:
            "An async function runs synchronously up to the first `await`. Everything after it becomes a continuation queued as a microtask. This means the code after an `await` never runs in the same synchronous turn, even when awaiting an already-resolved value.",
          followUps: [
            "Does `await 1` yield to the event loop?",
            "How would you run two awaits concurrently instead of sequentially?",
          ],
        },
        {
          position: 3,
          question: "What is a long task and why does it hurt user experience?",
          shortAnswer:
            "Any task over 50ms; it blocks input, animation, and rendering because a task always runs to completion.",
          explanation:
            "The loop cannot preempt running JavaScript. While a long task runs, clicks queue up unhandled and the page cannot repaint, so the UI appears frozen. Splitting the work into chunks or moving it to a worker restores responsiveness.",
          followUps: [
            "How do you find long tasks in a real session?",
            "When is a Web Worker better than chunking?",
          ],
        },
        {
          position: 4,
          question: "Where does `requestAnimationFrame` sit relative to microtasks and tasks?",
          shortAnswer:
            "Its callbacks run in the rendering step, after microtasks are drained and just before the browser paints.",
          explanation:
            "The loop checks whether a render is needed between tasks. If so, it runs `requestAnimationFrame` callbacks, then style, layout, and paint. That makes it the right place for visual updates and the wrong place for heavy computation.",
          followUps: [
            "Why is `rAF` better than `setTimeout` for animation?",
            "What happens to `rAF` callbacks in a background tab?",
          ],
        },
      ],
    },
    snippets: {
      create: [
        {
          position: 0,
          title: "Baseline ordering",
          language: "javascript",
          code: `console.log("A");

setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));

console.log("D");
// A, D, C, B`,
          explanation:
            "Synchronous logs first, then the microtask, then the timer task. This ordering is the single most tested fact about the event loop.",
          pitfall: "Assuming `setTimeout(fn, 0)` means 'run immediately' is the usual wrong answer.",
        },
        {
          position: 1,
          title: "async/await is microtask scheduling",
          language: "javascript",
          code: `async function run() {
  console.log("1");
  await null;
  console.log("3");
}

run();
console.log("2");
// 1, 2, 3`,
          explanation:
            "The body runs synchronously to the first `await`. The rest is queued as a microtask, so `2` prints before `3` even though nothing real was awaited.",
          pitfall: "`await` on an already-resolved value still yields; it is not a no-op.",
        },
        {
          position: 2,
          title: "Microtask starvation",
          language: "javascript",
          code: `let count = 0;

function spin() {
  if (count++ < 1e6) {
    Promise.resolve().then(spin);
  }
}

spin();
setTimeout(() => console.log("never soon"), 0);`,
          explanation:
            "Each microtask queues another, so the queue never empties and the loop never reaches the timer. The page becomes unresponsive with no long function in sight.",
          pitfall: "Recursive promise chains can freeze a page just as effectively as a `while (true)` loop.",
        },
        {
          position: 3,
          title: "Chunking a long task",
          language: "javascript",
          code: `async function processInChunks(items, handle, chunkSize = 500) {
  for (let i = 0; i < items.length; i += chunkSize) {
    items.slice(i, i + chunkSize).forEach(handle);
    // yield to the loop so input and paint can happen
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}`,
          explanation:
            "Each chunk is a separate task, so the browser can handle clicks and repaint in between. `scheduler.yield()` is the modern equivalent where supported.",
          pitfall: "Awaiting a promise alone is not enough; it must be a task, not a microtask, or the browser still cannot paint.",
        },
        {
          position: 4,
          title: "Sequential versus concurrent awaits",
          language: "javascript",
          code: `// ~2 seconds
const a = await delay(1000);
const b = await delay(1000);

// ~1 second
const [c, d] = await Promise.all([delay(1000), delay(1000)]);`,
          explanation:
            "The first version starts the second operation only after the first settles. `Promise.all` starts both immediately and awaits the slower one.",
          pitfall: "Awaiting inside a loop is the most common accidental serialisation of independent work.",
        },
      ],
    },
    practiceItems: {
      create: [
        {
          position: 0,
          kind: "PREDICT_OUTPUT",
          difficulty: "INTERMEDIATE",
          prompt: `console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
queueMicrotask(() => console.log(4));
console.log(5);`,
          options: [],
          answer: "1 5 3 4 2",
          explanation:
            "Synchronous logs 1 and 5 first. Then the microtask queue drains in FIFO order, giving 3 then 4. The timer task runs last.",
        },
        {
          position: 1,
          kind: "MCQ",
          difficulty: "FOUNDATIONAL",
          prompt: "When does the event loop drain the microtask queue?",
          options: [
            "After every synchronous statement",
            "After the current task completes and the call stack is empty",
            "Only when the task queue is empty",
            "At a fixed 4ms interval",
          ],
          answer: "After the current task completes and the call stack is empty",
          explanation:
            "Microtasks never interrupt running code. The loop drains the entire microtask queue once the stack empties, before taking the next task.",
        },
        {
          position: 2,
          kind: "PREDICT_OUTPUT",
          difficulty: "ADVANCED",
          prompt: `async function f() {
  console.log("a");
  await Promise.resolve();
  console.log("b");
}
console.log("start");
f();
setTimeout(() => console.log("timer"));
Promise.resolve().then(() => console.log("then"));
console.log("end");`,
          options: [],
          answer: "start a end b then timer",
          explanation:
            "`f()` logs 'a' synchronously and queues its continuation. 'end' finishes the sync work. Microtasks drain in order queued: 'b' was queued before 'then'. The timer task runs last.",
        },
        {
          position: 3,
          kind: "MCQ",
          difficulty: "INTERMEDIATE",
          prompt: "Which technique actually lets the browser paint during heavy work?",
          options: [
            "Wrapping the work in `Promise.resolve().then(...)`",
            "Splitting the work across tasks with `setTimeout` or `scheduler.yield`",
            "Marking the function `async`",
            "Calling `queueMicrotask` between iterations",
          ],
          answer: "Splitting the work across tasks with `setTimeout` or `scheduler.yield`",
          explanation:
            "Rendering happens between tasks, not between microtasks. Promise-based yielding keeps the loop inside the same task, so the page still cannot paint.",
        },
        {
          position: 4,
          kind: "CODING",
          difficulty: "INTERMEDIATE",
          prompt:
            "Write `yieldToMain()` that returns a promise resolving in a future task, so callers can break up long work.",
          options: [],
          starterCode: `function yieldToMain() {
  // your code here
}`,
          answer: `function yieldToMain() {
  if (typeof scheduler !== "undefined" && scheduler.yield) {
    return scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}`,
          explanation:
            "`setTimeout` schedules a task, which is what gives the browser a chance to handle input and paint. `scheduler.yield()` does the same with better priority handling where available. A bare `Promise.resolve()` would only queue a microtask and would not help.",
        },
        {
          position: 5,
          kind: "CODING",
          difficulty: "ADVANCED",
          prompt:
            "Implement `runWithConcurrency(tasks, limit)` that runs async task functions with at most `limit` in flight, resolving to results in input order.",
          options: [],
          starterCode: `async function runWithConcurrency(tasks, limit) {
  // your code here
}`,
          answer: `async function runWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );

  return results;
}`,
          explanation:
            "Each worker pulls the next index and awaits it, so at most `limit` promises are pending at once. Because `next++` happens synchronously before any `await`, no two workers can claim the same index. Writing into a preallocated array preserves input order.",
        },
      ],
    },
  },
];

async function main() {
  const javascript = await prisma.tech.upsert({
    where: { slug: "javascript" },
    update: {},
    create: {
      slug: "javascript",
      name: "JavaScript",
      category: "LANGUAGE",
      description:
        "The language of the web: scope, types, asynchrony, objects, and the runtime model behind them.",
      position: 0,
    },
  });

  const tags: Record<string, string[]> = {
    closures: ["scope", "functions", "memory"],
    "event-loop": ["asynchrony", "promises", "performance"],
  };

  for (const topic of javascriptTopics) {
    const slugs = tags[topic.slug] ?? [];

    await Promise.all(
      slugs.map((slug) =>
        prisma.tag.upsert({ where: { slug }, create: { slug, label: slug }, update: {} })
      )
    );

    // Re-seeding is destructive by design: delete then recreate so section rows never duplicate.
    await prisma.topic.deleteMany({ where: { techId: javascript.id, slug: topic.slug } });

    await prisma.topic.create({
      data: {
        ...topic,
        tech: { connect: { id: javascript.id } },
        tags: { connect: slugs.map((slug) => ({ slug })) },
      },
    });
  }

  await prisma.topic.update({
    where: { techId_slug: { techId: javascript.id, slug: "event-loop" } },
    data: { prerequisites: { connect: [{ techId_slug: { techId: javascript.id, slug: "closures" } }] } },
  });

  console.log(`Seeded ${javascriptTopics.length} JavaScript topics.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
