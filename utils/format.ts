// src/utils/format.ts

/**
 * Formats currency amount with PKR symbol and proper formatting
 * @param amount - The amount to format
 * @param currency - Currency code (default: PKR)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'PKR'): string => {
    try {
      return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount).replace('PKR', 'PKR ');
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `PKR ${amount.toFixed(2)}`;
    }
  };
  
  /**
   * Formats date string to local date format
   * @param dateString - ISO date string
   * @returns Formatted date string (DD/MM/YYYY)
   */
  export const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };
  
  /**
   * Formats date with time
   * @param dateString - ISO date string
   * @returns Formatted date-time string (DD/MM/YYYY HH:MM AM/PM)
   */
  export const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-PK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date/time:', error);
      return 'Invalid Date/Time';
    }
  };
  
  /**
   * Formats numbers with comma separators
   * @param number - Number to format
   * @returns Formatted string with thousands separators
   */
  export const formatNumber = (number: number): string => {
    try {
      return new Intl.NumberFormat('en-PK').format(number);
    } catch (error) {
      console.error('Error formatting number:', error);
      return number.toString();
    }
  };
  
  // Optional: Add more formatting functions as needed
  
  /**
   * Shortens long numbers with K/M/B suffixes
   * @param num - Number to shorten
   * @returns Formatted string (e.g., 1.5K, 2.3M)
   */
  export const shortenNumber = (num: number): string => {
    try {
      if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
      return num.toString();
    } catch (error) {
      console.error('Error shortening number:', error);
      return num.toString();
    }
  };