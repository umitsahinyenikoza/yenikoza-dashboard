// Frontend debug utility
const isDevelopment = process.env.NODE_ENV === 'development';

export const debugLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debugError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export const debugWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
}; 