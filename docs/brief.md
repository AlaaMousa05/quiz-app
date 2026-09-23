# byThursday practical assessment

Thank you for applying to byThursday. This is the practical part of our process.
Below is a brief from a client. It is written the way founders actually write to developers: quickly, with gaps, and with trust that a good engineer will fill them the way a senior person would. Read it as a real job, not as an exam question.

## How it works
You have 24 hours from the time you receive this message. Most people finish in 6 to 10 focused hours. We expect you to use Claude Code or a similar AI coding tool for most of the work. That is not a shortcut we tolerate, it is the skill we are hiring for, and we will ask you how you used it.
Use any language, framework or database you like. We will run your project from your README, so it must start with one command on a clean machine. Docker Compose is the easiest way to guarantee that. A no-Docker path with SQLite is fine too, as long as the README is exact.
The client is not available for questions. When something is unclear, decide, and write the decision down. That is part of the work.
There are no files attached to this brief. Create your own sample data that matches what the client describes. Make it realistic, and make it loadable, because the real data will arrive as spreadsheets.

## The brief
Hi, I am Nour. I run a small tutoring centre in Amman with about 300 students and 12 teachers. We run our weekly quizzes on paper and it is killing us.
I want a simple website where students log in, take a timed multiple choice quiz, and see their score at the end. Our teachers will put the quizzes in. Each quiz has a time limit (usually 20 minutes) and a date range when it is open. Students should not be able to take a quiz twice. I also want to see how the students did.
One more thing: some of our teachers give negative marks for wrong answers and some do not. It depends on the teacher and the quiz.
I will send you our real student list, teacher list and last week's quiz as spreadsheets once you have something to show me. For now, please make up some data that looks like ours. We have three classes at the moment, 10A, 10B and 11A, with around 20 students in each. Four of our teachers would be using this to start with. A typical quiz has 15 questions with four options each, and each question has its own number of points. Many of our students have Arabic names and some of our quizzes are in Arabic, so please make sure that works.
We do not have a designer, so make it look clean, and it has to work well on phones because most students only have their phone.
Can you have something I can click through by Thursday?
Nour

## What to deliver
A public GitHub repository containing all of the following. We check every item.
1. The complete source code of the application. Not a build folder, not a zip file, and not only a link to a deployed site. Everything needed to run the project from scratch must be in the repository.
2. A README.md that explains how to run the project locally with one command, how to load your sample data, and the login details for a student, a teacher, and any other kind of user you created.
3. A DECISIONS.md that lists the assumptions you made, what you built that Nour did not ask for and why, what you deliberately left out, and what you would do next if you had another week.
4. An AI_USAGE.md that says which AI tools you used, how you directed them, and how you checked their output. A committed CLAUDE.md or similar configuration file is welcome alongside it. Be honest here. We read this closely.
5. Automated tests for the parts of the system you consider most important to get right.
6. A commit history that shows how the work progressed. Commit as you go. A single commit with everything in it tells us very little.

## What we look at
We read the whole repository, we run it, and we try to break it. In broad terms we look at how you handled what the brief did not say, whether the application is correct when someone behaves badly, how it holds up on a phone, the quality and structure of the code, what your tests cover, how you worked with your AI tools, and how clearly you explain your decisions in writing.
You will not receive a score. You will receive a decision.

## Submitting
Reply to this message within 24 hours with the link to your public GitHub repository. We review the repository as it is at the moment you send it. Anything you push later is not reviewed.

## Common questions
- Starter templates / UI kits are allowed, but the work must be yours.
- A language or framework not on your profile is allowed, but explain why in DECISIONS.md.
- If you run out of time, submit what you have and say in DECISIONS.md what is unfinished.
