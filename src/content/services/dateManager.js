// Date management service

class DateManager {
  constructor() {
    this.currentDate = new Date();
    this.monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  // Get current date
  getCurrentDate() {
    return this.currentDate;
  }

  // Set current date
  setCurrentDate(date) {
    this.currentDate = new Date(date);
  }

  // Get start of week (Monday) for a given date
  getStartOfWeek(date = this.currentDate) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    result.setDate(diff);
    return result;
  }

  // Get dates for the current week
  getWeekDates(date = this.currentDate) {
    const startOfWeek = this.getStartOfWeek(date);
    const weekDates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  }

  // Navigate week forward/backward
  navigateWeek(direction) {
    const newDate = new Date(this.currentDate);
    newDate.setDate(this.currentDate.getDate() + (direction * 7));
    this.currentDate = newDate;
    return newDate;
  }

  // Get calendar grid for a month
  getMonthGrid(date = this.currentDate) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const firstDayIndex = firstDay.getDay();
    
    const grid = [];
    
    // Add empty cells for days before first of month
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= totalDays; day++) {
      grid.push(new Date(year, month, day));
    }
    
    return grid;
  }

  // Format date for display
  formatDate(date) {
    return {
      day: this.dayNames[date.getDay()],
      date: date.getDate(),
      month: this.monthNames[date.getMonth()],
      year: date.getFullYear()
    };
  }

  // Check if two dates are the same day
  isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  // Get date components
  getDateComponents(date = this.currentDate) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1, // Convert to 1-based month
      day: date.getDate()
    };
  }
}

// Export singleton instance
export const dateManager = new DateManager();
