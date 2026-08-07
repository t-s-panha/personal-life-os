import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("demo123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@lifeos.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@lifeos.com",
      password: hashedPassword,
      profile: {
        create: {
          displayName: "Demo User",
          mainGoals: JSON.stringify(["Master geospatial analytics", "Get fit", "Learn Mandarin"]),
          sleepTarget: 8,
        },
      },
      settings: { create: {} },
    },
  });

  // Phase 1: Tasks
  await prisma.task.createMany({
    data: [
      { userId: user.id, title: "Complete Python GIS tutorial", priority: 3, status: "IN_PROGRESS", category: "Education", dueDate: new Date(Date.now() + 2 * 86400000) },
      { userId: user.id, title: "Morning workout - Push day", priority: 2, status: "PLANNED", category: "Fitness", dueDate: new Date() },
      { userId: user.id, title: "Read Remote Sensing chapter 3", priority: 2, status: "BACKLOG", category: "Education" },
      { userId: user.id, title: "Review weekly goals", priority: 3, status: "PLANNED", category: "Productivity" },
      { userId: user.id, title: "Practice Mandarin 30 min", priority: 2, status: "PLANNED", category: "Language" },
      { userId: user.id, title: "Update portfolio website", priority: 1, status: "BACKLOG", category: "Career" },
      { userId: user.id, title: "Meditation", priority: 1, status: "COMPLETED", category: "Health", completedAt: new Date() },
    ],
  });

  // Phase 1: Habits
  const habits = await prisma.habit.createMany({
    data: [
      { userId: user.id, name: "Wake up at 6:30 AM", category: "discipline", frequency: "DAILY", order: 1 },
      { userId: user.id, name: "Exercise 45 min", category: "fitness", frequency: "DAILY", order: 2 },
      { userId: user.id, name: "Study 2 hours", category: "study", frequency: "DAILY", order: 3 },
      { userId: user.id, name: "Read 30 minutes", category: "study", frequency: "DAILY", order: 4 },
      { userId: user.id, name: "Meditate 10 min", category: "mindfulness", frequency: "DAILY", order: 5 },
      { userId: user.id, name: "Journal", category: "discipline", frequency: "DAILY", order: 6 },
      { userId: user.id, name: "Drink 3L water", category: "health", frequency: "DAILY", targetCount: 3, order: 7 },
      { userId: user.id, name: "No social media before noon", category: "discipline", frequency: "DAILY", order: 8 },
    ],
  });

  const habitList = await prisma.habit.findMany({ where: { userId: user.id } });
  for (const habit of habitList) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(); date.setDate(date.getDate() - i); date.setHours(0, 0, 0, 0);
      const completed = Math.random() > (i * 0.1 + 0.1);
      await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: habit.id, date } },
        update: {},
        create: { habitId: habit.id, userId: user.id, date, completed, count: completed ? habit.targetCount : 0 },
      });
    }
  }

  // Phase 1: Goals
  await prisma.goal.createMany({
    data: [
      { userId: user.id, title: "Become expert in geospatial data analytics", timeframe: "VISION", startDate: new Date(), targetDate: new Date(Date.now() + 5 * 365 * 86400000), category: "education" },
      { userId: user.id, title: "Complete Python GIS specialization", timeframe: "ANNUAL", startDate: new Date(), targetDate: new Date(Date.now() + 365 * 86400000), category: "education", currentValue: 35, progress: 35 },
      { userId: user.id, title: "Build 5 portfolio projects", timeframe: "ANNUAL", startDate: new Date(), targetDate: new Date(Date.now() + 365 * 86400000), category: "career", currentValue: 2, progress: 40 },
      { userId: user.id, title: "Lose 10kg and build muscle", timeframe: "ANNUAL", startDate: new Date(), targetDate: new Date(Date.now() + 365 * 86400000), category: "fitness", currentValue: 3, progress: 30 },
      { userId: user.id, title: "Study 60 hours this month", timeframe: "MONTHLY", startDate: new Date(), targetDate: new Date(Date.now() + 30 * 86400000), category: "education", currentValue: 24, progress: 40 },
      { userId: user.id, title: "Workout 12 times this month", timeframe: "MONTHLY", startDate: new Date(), targetDate: new Date(Date.now() + 30 * 86400000), category: "fitness", currentValue: 5, progress: 42 },
    ],
  });

  // Phase 1: Time entries
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const timeData = [
    { start: 6, duration: 45 * 60, category: "exercise", desc: "Morning workout" },
    { start: 8, duration: 90 * 60, category: "study", desc: "Python GIS course" },
    { start: 10, duration: 60 * 60, category: "coding", desc: "Portfolio project" },
    { start: 14, duration: 120 * 60, category: "study", desc: "Remote sensing reading" },
    { start: 17, duration: 30 * 60, category: "reading", desc: "Technical article" },
  ];
  for (const entry of timeData) {
    const startTime = new Date(today); startTime.setHours(entry.start, 0, 0, 0);
    const endTime = new Date(startTime); endTime.setSeconds(endTime.getSeconds() + entry.duration);
    await prisma.timeEntry.create({
      data: { userId: user.id, startTime, endTime, duration: entry.duration, category: entry.category, description: entry.desc, productivityRating: Math.floor(Math.random() * 2) + 3, source: "manual" },
    });
  }

  // Phase 1: Sleep
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  await prisma.sleepRecord.create({
    data: { userId: user.id, date: yesterday, bedTime: new Date(yesterday.getTime() + 22.5 * 3600000), wakeTime: new Date(yesterday.getTime() + 30.5 * 3600000), duration: 8, quality: 8 },
  });

  // Phase 2: Subjects
  const subjects = await prisma.subject.createMany({
    data: [
      { userId: user.id, name: "Remote Sensing", category: "technical", currentLevel: "intermediate", targetLevel: "advanced", progress: 45, totalStudyHours: 45, order: 1 },
      { userId: user.id, name: "Python", category: "technical", currentLevel: "intermediate", targetLevel: "advanced", progress: 60, totalStudyHours: 120, order: 2 },
      { userId: user.id, name: "GIS", category: "technical", currentLevel: "basic", targetLevel: "advanced", progress: 30, totalStudyHours: 25, order: 3 },
      { userId: user.id, name: "Machine Learning", category: "technical", currentLevel: "beginner", targetLevel: "intermediate", progress: 15, totalStudyHours: 12, order: 4 },
      { userId: user.id, name: "English", category: "language", currentLevel: "advanced", targetLevel: "expert", progress: 70, totalStudyHours: 200, order: 5 },
      { userId: user.id, name: "Mandarin", category: "language", currentLevel: "beginner", targetLevel: "intermediate", progress: 20, totalStudyHours: 35, order: 6 },
    ],
  });

  // Phase 2: Study sessions
  const subjectList = await prisma.subject.findMany({ where: { userId: user.id } });
  for (let i = 0; i < 10; i++) {
    const subject = subjectList[Math.floor(Math.random() * subjectList.length)];
    const startTime = new Date(today); startTime.setHours(8 + i, 0, 0, 0);
    const duration = (30 + Math.floor(Math.random() * 90)) * 60;
    const endTime = new Date(startTime); endTime.setSeconds(endTime.getSeconds() + duration);
    await prisma.studySession.create({
      data: { userId: user.id, subjectId: subject.id, startTime, endTime, duration, topic: `Study session ${i + 1}`, productivityRating: Math.floor(Math.random() * 2) + 3, source: "manual" },
    });
  }

  // Phase 2: Skills
  await prisma.skill.createMany({
    data: [
      { userId: user.id, name: "Python Programming", category: "technical", currentLevel: 3, targetLevel: 5, importance: 5, totalHours: 120, lastPracticed: new Date() },
      { userId: user.id, name: "Geospatial Analysis", category: "technical", currentLevel: 2, targetLevel: 4, importance: 5, totalHours: 45 },
      { userId: user.id, name: "Satellite Image Processing", category: "technical", currentLevel: 2, targetLevel: 4, importance: 4, totalHours: 30 },
      { userId: user.id, name: "English Writing", category: "language", currentLevel: 4, targetLevel: 5, importance: 4, totalHours: 150 },
      { userId: user.id, name: "Mandarin Speaking", category: "language", currentLevel: 1, targetLevel: 3, importance: 3, totalHours: 25 },
      { userId: user.id, name: "Data Visualization", category: "technical", currentLevel: 3, targetLevel: 4, importance: 3, totalHours: 40 },
    ],
  });

  // Phase 2: Focus sessions
  for (let i = 0; i < 5; i++) {
    const startTime = new Date(today); startTime.setHours(9 + i * 2, 0, 0, 0);
    const duration = 25 * 60;
    const endTime = new Date(startTime); endTime.setSeconds(endTime.getSeconds() + duration);
    await prisma.focusSession.create({
      data: { userId: user.id, startTime, endTime, duration, presetName: "Pomodoro", workDuration: 25 * 60, breakDuration: 5 * 60, distractions: Math.floor(Math.random() * 3), focusRating: Math.floor(Math.random() * 2) + 3, isCompleted: true },
    });
  }

  // Phase 2: Language tests
  await prisma.languageTest.createMany({
    data: [
      { userId: user.id, language: "English", testType: "IELTS", testDate: new Date(Date.now() - 90 * 86400000), listening: 7.5, reading: 8.0, writing: 6.5, speaking: 7.0, overall: 7.5 },
      { userId: user.id, language: "English", testType: "IELTS", testDate: new Date(Date.now() - 30 * 86400000), listening: 8.0, reading: 8.5, writing: 7.0, speaking: 7.5, overall: 8.0 },
    ],
  });

  // Phase 3: Exercises
  const exercises = await prisma.exercise.createMany({
    data: [
      { userId: user.id, name: "Bench Press", category: "strength", muscleGroup: "Chest", maxWeight: 80 },
      { userId: user.id, name: "Squat", category: "strength", muscleGroup: "Legs", maxWeight: 100 },
      { userId: user.id, name: "Deadlift", category: "strength", muscleGroup: "Back", maxWeight: 120 },
      { userId: user.id, name: "Overhead Press", category: "strength", muscleGroup: "Shoulders", maxWeight: 50 },
      { userId: user.id, name: "Pull-ups", category: "strength", muscleGroup: "Back", maxReps: 12 },
      { userId: user.id, name: "Running", category: "cardio", muscleGroup: "Legs", maxDistance: 5000 },
    ],
  });

  // Phase 3: Workouts
  const exerciseList = await prisma.exercise.findMany({ where: { userId: user.id } });
  for (let i = 0; i < 5; i++) {
    const date = new Date(today); date.setDate(date.getDate() - i);
    const workout = await prisma.workout.create({
      data: { userId: user.id, name: `${["Push", "Pull", "Legs", "Full Body", "Cardio"][i % 5]} Day`, type: ["Push", "Pull", "Legs", "Full Body", "Cardio"][i % 5], date, startTime: new Date(date.getTime() + 6 * 3600000), endTime: new Date(date.getTime() + 7.5 * 3600000), duration: 90 * 60, rating: Math.floor(Math.random() * 2) + 3 },
    });

    // Add sets
    for (let j = 0; j < 3; j++) {
      const exercise = exerciseList[Math.floor(Math.random() * exerciseList.length)];
      const weight = exercise.maxWeight ? Math.round(exercise.maxWeight * (0.7 + Math.random() * 0.2)) : null;
      const reps = exercise.maxReps ? Math.round(exercise.maxReps * (0.7 + Math.random() * 0.2)) : Math.floor(Math.random() * 5) + 8;
      await prisma.workoutSet.create({
        data: { workoutId: workout.id, exerciseId: exercise.id, setNumber: j + 1, reps, weight, isPR: false },
      });
    }
  }

  // Update workout totals
  const allWorkouts = await prisma.workout.findMany({ where: { userId: user.id }, include: { sets: true } });
  for (const w of allWorkouts) {
    const totalVolume = w.sets.reduce((s, set) => s + ((set.reps || 0) * (set.weight || 0)), 0);
    await prisma.workout.update({ where: { id: w.id }, data: { totalVolume, totalSets: w.sets.length, totalReps: w.sets.reduce((s, set) => s + (set.reps || 0), 0) } });
  }

  // Phase 3: More sleep records
  for (let i = 1; i < 14; i++) {
    const date = new Date(today); date.setDate(date.getDate() - i);
    const duration = 6 + Math.random() * 3;
    const quality = Math.floor(5 + Math.random() * 5);
    await prisma.sleepRecord.create({
      data: { userId: user.id, date, bedTime: new Date(date.getTime() + 22.5 * 3600000), wakeTime: new Date(date.getTime() + (22.5 + duration) * 3600000), duration, quality },
    });
  }

  console.log("Seed completed successfully!");
  console.log("Demo credentials: demo@lifeos.com / demo123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
