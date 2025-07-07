// Zaman formatlama utility fonksiyonları

/**
 * Son görülme zamanını kullanıcı dostu formatta döndürür
 * @param {number} minutes - Dakika cinsinden süre
 * @returns {string} Formatlanmış zaman string'i
 */
export const formatLastSeen = (minutes) => {
  if (!minutes || minutes < 0) {
    return 'Bilinmiyor';
  }

  if (minutes < 1) {
    return 'Az önce';
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} dakika önce`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours} saat önce`;
    }
    return `${hours} saat ${remainingMinutes} dakika önce`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days < 7) {
    if (remainingHours === 0) {
      return `${days} gün önce`;
    }
    return `${days} gün ${remainingHours} saat önce`;
  }

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  if (weeks < 4) {
    if (remainingDays === 0) {
      return `${weeks} hafta önce`;
    }
    return `${weeks} hafta ${remainingDays} gün önce`;
  }

  const months = Math.floor(weeks / 4);
  const remainingWeeks = weeks % 4;

  if (months < 12) {
    if (remainingWeeks === 0) {
      return `${months} ay önce`;
    }
    return `${months} ay ${remainingWeeks} hafta önce`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} yıl önce`;
  }
  return `${years} yıl ${remainingMonths} ay önce`;
};

/**
 * İki tarih arasındaki farkı dakika cinsinden hesaplar
 * @param {Date|string} date1 - İlk tarih
 * @param {Date|string} date2 - İkinci tarih (opsiyonel, varsayılan: şu an)
 * @returns {number} Dakika cinsinden fark
 */
export const getMinutesDifference = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return 0;
  }
  
  const diffMs = Math.abs(d2 - d1);
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Tarihi kullanıcı dostu formatta döndürür
 * @param {Date|string} date - Tarih
 * @returns {string} Formatlanmış tarih
 */
export const formatDate = (date) => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Geçersiz tarih';
  }
  
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Bugün ${d.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }
  
  if (diffDays === 1) {
    return `Dün ${d.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }
  
  if (diffDays < 7) {
    return `${diffDays} gün önce ${d.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }
  
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 