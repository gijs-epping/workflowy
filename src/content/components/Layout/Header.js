// Header component with calendar and navigation
import { Calendar } from '../Calendar/Calendar.js';
import { DateGrid } from '../Calendar/DateGrid.js';

export class Header {
  constructor(onDateChange) {
    this.element = null;
    this.onDateChange = onDateChange;
    this.calendar = null;
    this.dateGrid = null;
    this.instanceId = 'wf-daily-' + Date.now();
  }

  // Create header element
  create() {
    this.element = document.createElement('div');
    this.element.className = 'workflowy-daily-header';
    this.element.setAttribute('data-instance-id', this.instanceId);

    // Create navigation arrows
    const prevButton = this.createNavButton('prevDaily', 'Previous Week', `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `);

    const nextButton = this.createNavButton('nextDaily', 'Next Week', `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `);

    // Create calendar components
    this.calendar = new Calendar(date => this.handleDateSelect(date));
    this.dateGrid = new DateGrid(date => this.handleDateSelect(date));

    // Add event listeners for navigation
    prevButton.addEventListener('click', () => this.navigateWeek(-1));
    nextButton.addEventListener('click', () => this.navigateWeek(1));

    // Assemble header
    this.element.appendChild(prevButton);
    this.element.appendChild(this.calendar.create());
    this.element.appendChild(this.dateGrid.create());
    this.element.appendChild(nextButton);

    return this.element;
  }

  // Create navigation button
  createNavButton(className, ariaLabel, svg) {
    const button = document.createElement('button');
    button.className = `daily-nav-arrow ${className}`;
    button.setAttribute('aria-label', ariaLabel);
    button.innerHTML = svg;
    return button;
  }

  // Handle date selection
  handleDateSelect(date) {
    if (this.onDateChange) {
      this.onDateChange(date);
    }
    this.updateDisplay(date);
  }

  // Navigate week forward/backward
  navigateWeek(direction) {
    const newDate = this.dateGrid.navigateWeek(direction);
    if (this.onDateChange) {
      this.onDateChange(newDate);
    }
    this.updateDisplay(newDate);
  }

  // Update display for new date
  updateDisplay(date) {
    this.calendar.setDate(date);
    this.dateGrid.setActiveDate(date);
  }

  // Clean up header
  cleanup() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.calendar = null;
    this.dateGrid = null;
  }
}
