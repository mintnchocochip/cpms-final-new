import React from 'react';

const PanelStatsCard = ({ icon: Icon, title, value, bgColor, iconBg }) => {
  return (
    <div className={`${bgColor} rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium opacity-90">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${iconBg} p-2 sm:p-3 rounded-xl`}>
          <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
        </div>
      </div>
    </div>
  );
};

export default PanelStatsCard;
