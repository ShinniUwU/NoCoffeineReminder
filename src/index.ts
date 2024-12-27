import { CronJob } from 'cron';
import { spawn, ChildProcess } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { GlobalKeyboardListener } from 'node-global-key-listener';

/**
 * Global references to the Cron job and the ffplay child process
 * so we can stop them anywhere (e.g. when user presses Alt+F).
 */
let currentJob: CronJob | null = null;
let audioProcess: ChildProcess | null = null;

// Create a Readline interface for menu prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/** Displays a simple menu */
function showMenu() {
  console.log('\nChoose an option:');
  console.log('1. Settings');
  console.log('2. Exit');

  rl.question('> ', (answer) => {
    switch (answer.trim()) {
      case '1':
        settings();
        break;
      case '2':
        // Exit the process
        process.exit(0);
        break;
      default:
        console.clear();
        console.log('Invalid option. Please try again.');
        showMenu();
    }
  });
}

/**
 * Reads settings.json to get the user's chosen time/cron expression,
 * then schedules the reminder.
 */
function remind() {
  fs.readFile('./settings.json', 'utf8', (errRead, data) => {
    if (errRead) {
      console.error("Error reading settings file:", errRead);
      console.log("Using default time (20:00).");
      scheduleReminder('0 0 20 * * *', '20:00');
    } else {
      try {
        const storedSettings = JSON.parse(data);
        if (!storedSettings.cronExpression) {
          console.log("No cronExpression found; using default 20:00");
          scheduleReminder('0 0 20 * * *', '20:00');
        } else {
          scheduleReminder(storedSettings.cronExpression, storedSettings.time);
        }
      } catch (parseError) {
        console.error("Failed to parse settings.json:", parseError);
        console.log("Using default time (20:00).");
        scheduleReminder('0 0 20 * * *', '20:00');
      }
    }
  });
}

/**
 * Actually schedules the reminder using the given cron expression.
 * `timeLabel` is just for showing the user what time we scheduled.
 */
function scheduleReminder(cronExpr: string, timeLabel: string) {
  // Stop any existing job first
  if (currentJob) {
    currentJob.stop();
  }

  currentJob = new CronJob(cronExpr, () => {
    console.clear();
    console.log(`Reminder time! Press ALT+F (system-wide) to stop the sound.`);

    // If a previous ffplay process is still around, kill it just in case
    if (audioProcess) {
      try {
        audioProcess.kill();
      } catch (err) {
        // ignore
      }
      audioProcess = null;
    }

    // Spawn ffplay in headless mode: no display window, autoexit after finish
    // We assume ffplay is on your PATH. If not, provide full path to ffplay.exe
    audioProcess = spawn('ffplay', [
      '-nodisp',          // No display window
      '-autoexit',        // Exit when file ends
      path.join(__dirname, 'sound', 'sound.mp3')
    ], {
      stdio: 'ignore'     // Don’t show ffplay logs in console
    });

    console.log('Sound is now playing...');
  });

  currentJob.start();
  console.log(`Reminder scheduled. It will run daily at '${timeLabel}' (cron: ${cronExpr}).`);
  // Return to the menu
  showMenu();
}

/**
 * Allows the user to view or change their reminder settings (time).
 */
function settings() {
  fs.stat('./settings.json', (err) => {
    if (err) {
      // File doesn’t exist, so ask for time
      rl.question("What time do you want to be reminded about caffeine? ", (answer) => {
        const cronExpression = humanifyCron(answer);
        const config = { time: answer, cronExpression };
        fs.writeFile('./settings.json', JSON.stringify(config, null, 2), (errWrite) => {
          if (errWrite) {
            console.error("Failed to save settings:", errWrite);
          } else {
            console.log("Settings saved successfully!");
            remind();
          }
        });
      });
    } else {
      // File exists, so read existing settings
      fs.readFile('./settings.json', 'utf8', (errRead, data) => {
        if (errRead) {
          console.error("Error reading settings file:", errRead);
          return showMenu();
        }

        const storedSettings = JSON.parse(data);
        console.log("Current reminder settings:");
        console.log("  Time (human):", storedSettings.time);
        console.log("  Cron expr:   ", storedSettings.cronExpression);
        console.log("\nDo you want to change this setting? (Y/N)");

        rl.question("> ", (choice) => {
          const c = choice.trim().toLowerCase();
          if (c === 'y') {
            rl.question("Enter a new reminder time: ", (newTime) => {
              const newCronExpression = humanifyCron(newTime);
              const newConfig = { time: newTime, cronExpression: newCronExpression };

              fs.writeFile('./settings.json', JSON.stringify(newConfig, null, 2), (errWrite) => {
                if (errWrite) {
                  console.error("Failed to save new settings:", errWrite);
                  showMenu();
                } else {
                  console.log("Settings updated successfully!");
                  remind();
                }
              });
            });
          } else {
            showMenu();
          }
        });
      });
    }
  });
}

/**
 * Converts a human-friendly time string (e.g. "8:00 PM") into a cron expression
 * e.g. "0 0 20 * * *" = 8 PM daily
 */
function humanifyCron(timeString: string): string {
  const normalizedTimeString = timeString.trim().toUpperCase();
  const parts = normalizedTimeString.split(/\s+/);
  let timePart = parts[0];
  let meridianPart = parts[1]; // AM, PM, or undefined

  let [hourStr, minuteStr = '0'] = timePart.split(':');
  let hour = parseInt(hourStr, 10);
  let minute = parseInt(minuteStr, 10);

  // Handle AM/PM
  if (meridianPart) {
    if (meridianPart === 'PM' && hour !== 12) {
      hour += 12;
    } else if (meridianPart === 'AM' && hour === 12) {
      hour = 0;
    }
  }

  // Basic validation
  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hourStr}`);
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minuteStr}`);
  }

  // CRON format: second minute hour day-of-month month day-of-week
  return `0 ${minute} ${hour} * * *`;
}

/** 
 * Main entry point: schedule a reminder and show the menu.
 * Also sets up a global key listener for Alt+F to stop the sound.
 */
function main() {
  console.clear();
  remind();

  // Set up the global key listener
  const keyboard = new GlobalKeyboardListener();

  // Listen for Alt+F globally
  keyboard.addListener((e, down) => {
    // On Windows: 'LEFT ALT' or 'RIGHT ALT'
    // On Mac: "OPTION" keys
    if (
      e.state === 'DOWN' &&
      e.name === 'F' &&
      (down['LEFT ALT'] || down['RIGHT ALT'])
    ) {
      console.log('Reminder stopped via Alt+F!');

      // Stop the CronJob if active
      if (currentJob) {
        currentJob.stop();
      }

      // Also kill the ffplay process (if playing)
      if (audioProcess) {
        try {
          audioProcess.kill('SIGTERM'); // or 'SIGKILL'
          console.log("Audio process (ffplay) killed.");
        } catch (err) {
          console.error("Failed to kill ffplay process:", err);
        }
        audioProcess = null;
      }
    }
  });
}

// Start the program
main();
