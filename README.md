# NoCoffeeInReminder

NoCoffeeInReminder is a simple reminder tool designed to help you remember when to stop drinking coffee. It allows you to set a time for a daily reminder, at which point it will play a sound using `ffplay`. The sound is triggered using a cron expression, and the reminder can be stopped at any time by pressing `Alt + F` on your keyboard.

## Features

- **Reminder Scheduling**: Set a daily reminder time for your caffeine break.
- **Sound Notification**: Play a sound to remind you to take a break, using `ffplay`.
- **Global Keyboard Listener**: Stop the sound at any time by pressing `Alt + F`.
- **Customizable Time**: Use a human-readable time (e.g., "8:00 PM") to set the reminder time.
- **Persistent Settings**: Save the reminder time and cron expression in a JSON file for future use.

## Requirements

- Node.js (v16 or higher)
- ffplay (part of `ffmpeg`, ensure it's installed and available in your system's PATH)
- `node-global-key-listener` for global keyboard listening.

## Installation

1. Clone the repository or download the source code.
2. Install dependencies:
    ```bash
    npm install
    ```

3. Ensure that `ffplay` is available on your system. If not, you may need to install `ffmpeg`:
    - On macOS:
      ```bash
      brew install ffmpeg
      ```
    - On Ubuntu:
      ```bash
      sudo apt install ffmpeg
      ```
    - On Windows: Follow the installation guide for [FFmpeg](https://ffmpeg.org/download.html).

4. Run the application:
    ```bash
    node nocoffeinereminder.js
    ```

## Usage

When the program starts, you will be presented with a menu:

1. **Settings**: Set or update the time for your daily reminder.
2. **Exit**: Close the application.

### Setting a Reminder

- When you choose to set the reminder, you will be asked for a time (e.g., `8:00 PM`).
- The time will be converted into a cron expression for daily execution.

### Reminder Sound

- Once the reminder is scheduled, it will play a sound at the set time. You can stop the sound by pressing `Alt + F` globally.

### Changing Reminder Time

- You can change the reminder time at any time by accessing the settings menu.

## Example

1. Start the program:
    ```bash
    node nocoffeinereminder.js
    ```

2. You will be asked to enter a reminder time (e.g., `8:00 PM`).
3. The reminder is set and will trigger every day at that time.
4. If you press `Alt + F`, the reminder sound will stop.

## Files

- `settings.json`: Stores your reminder time and cron expression.
- `sound/sound.mp3`: The audio file played when the reminder triggers.

## Development

To contribute or modify the tool:

1. Clone the repository.
2. Install the necessary dependencies with `npm install`.
3. Make changes, test them locally, and submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
