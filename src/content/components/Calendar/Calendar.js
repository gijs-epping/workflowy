// Calendar popup component
import { dateManager } from '../../services/dateManager.js';

export class Calendar {
  constructor(onDateSelect) {
    this.element = null;
    this.popup = null;
    this.onDateSelect = onDateSelect;
    this.isVisible = false;
  }

  // Create the calendar button and popup
  create() {
    // Create container
    this.element = document.createElement('div');
    this.element.className = 'daily-calendar';

    // Create calendar button
    const button = document.createElement('button');
    button.className = 'calendar-button';
    button.setAttribute('aria-label', 'Open Calendar');
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = 'calendar-popup';
    this.popup.style.display = 'none';
    this.popup.innerHTML = `
      <div class="calendar-header">
        <button class="prev-month">&lt;</button>
        <span class="current-month-year"></span>
        <button class="next-month">&gt;</button>
      </div>
      <div class="calendar-grid">
        <div class="weekday">Sun</div>
        <div class="weekday">Mon</div>
        <div class="weekday">Tue</div>
        <div class="weekday">Wed</div>
        <div class="weekday">Thu</div>
        <div class="weekday">Fri</div>
        <div class="weekday">Sat</div>
      </div>
    `;

    // Add event listeners
    button.addEventListener('click', () => this.togglePopup());
    
    const prevMonthBtn = this.popup.querySelector('.prev-month');
    const nextMonthBtn = this.popup.querySelector('.next-month');
    
    prevMonthBtn.addEventListener('click', () => {
      const date = dateManager.getCurrentDate();
      date.setMonth(date.getMonth() - 1);
      this.renderCalendarGrid(date);
    });

    nextMonthBtn.addEventListener('click', () => {
      const date = dateManager.getCurrentDate();
      date.setMonth(date.getMonth() + 1);
      this.renderCalendarGrid(date);
    });

    // Close calendar when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.element.contains(e.target)) {
        this.hidePopup();
      }
    });

    // Assemble elements
    this.element.appendChild(button);
    this.element.appendChild(this.popup);

    // Initial render
    this.renderCalendarGrid(dateManager.getCurrentDate());

    return this.element;
  }

  // Toggle popup visibility
  togglePopup() {
    if (this.isVisible) {
      this.hidePopup();
    } else {
      this.showPopup();
    }
  }

  // Show popup
  showPopup() {
    if (this.popup) {
      this.popup.style.display = 'block';
      this.isVisible = true;
      this.renderCalendarGrid(dateManager.getCurrentDate());
    }
  }

  // Hide popup
  hidePopup() {
    if (this.popup) {
      this.popup.style.display = 'none';
      this.isVisible = false;
    }
  }

  // Render calendar grid for given date
  renderCalendarGrid(date) {
    if (!this.popup) return;

    const monthYearSpan = this.popup.querySelector('.current-month-year');
    const calendarGrid = this.popup.querySelector('.calendar-grid');
    const today = new Date();
    const currentDate = dateManager.getCurrentDate();

    // Update month and year display
    const formatted = dateManager.formatDate(date);
    monthYearSpan.textContent = `${formatted.month} ${formatted.year}`;

    // Clear existing calendar days
    const existingDays = calendarGrid.querySelectorAll('.calendar-day');
    existingDays.forEach(day => day.remove());

    // Get calendar grid data
    const grid = dateManager.getMonthGrid(date);

    // Add days to grid
    grid.forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';

      if (day === null) {
        dayElement.classList.add('empty');
      } else {
        dayElement.textContent = day.getDate();

        if (dateManager.isSameDay(day, today)) {
          dayElement.classList.add('current-day');
        }
        
        if (dateManager.isSameDay(day, currentDate)) {
          dayElement.classList.add('selected-day');
        }

        dayElement.addEventListener('click', () => {
          if (this.onDateSelect) {
            this.onDateSelect(day);
            this.hidePopup();
          }
        });
      }

      calendarGrid.appendChild(dayElement);
    });
  }

  // Update calendar with new date
  setDate(date) {
    if (this.isVisible) {
      this.renderCalendarGrid(date);
    }
  }
}
