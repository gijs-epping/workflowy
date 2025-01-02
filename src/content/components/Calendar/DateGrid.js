// Date grid component for week view
import { dateManager } from '../../services/dateManager.js';

export class DateGrid {
  constructor(onDateSelect) {
    this.element = null;
    this.onDateSelect = onDateSelect;
  }

  // Create the date grid element
  create() {
    this.element = document.createElement('div');
    this.element.className = 'daily-date-grid';
    this.render();
    return this.element;
  }

  // Render the date grid
  render() {
    if (!this.element) return;
    
    this.element.innerHTML = '';
    const weekDates = dateManager.getWeekDates();
    const currentDate = dateManager.getCurrentDate();

    weekDates.forEach(date => {
      const cell = document.createElement('div');
      cell.className = 'daily-date-cell';
      
      if (dateManager.isSameDay(date, currentDate)) {
        cell.classList.add('active');
      }

      const formatted = dateManager.formatDate(date);
      cell.innerHTML = `
        <div class="day">${formatted.day}</div>
        <div class="date">${formatted.date}</div>
      `;

      cell.addEventListener('click', () => {
        if (this.onDateSelect) {
          this.onDateSelect(date);
        }
      });

      this.element.appendChild(cell);
    });
  }

  // Update active date
  setActiveDate(date) {
    if (!this.element) return;

    // Remove active class from all cells
    this.element.querySelectorAll('.daily-date-cell').forEach(cell => {
      cell.classList.remove('active');
    });

    // Find and activate the matching cell
    const cells = this.element.querySelectorAll('.daily-date-cell');
    const weekDates = dateManager.getWeekDates();
    
    weekDates.forEach((weekDate, index) => {
      if (dateManager.isSameDay(weekDate, date) && cells[index]) {
        cells[index].classList.add('active');
      }
    });
  }

  // Navigate to previous/next week
  navigateWeek(direction) {
    const newDate = dateManager.navigateWeek(direction);
    this.render();
    return newDate;
  }
}
