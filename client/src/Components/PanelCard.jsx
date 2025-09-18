import React from 'react';
import { ChevronRight, ChevronDown, Users, Building2, Trash2, MapPin } from 'lucide-react';

const PanelCard = ({ 
  panel, 
  index, 
  isExpanded, 
  onToggleExpand, 
  onRemovePanel,
  availableTeams,
  onManualAssign,
  unassignedTeams,
  allGuideProjects,
  onRemoveTeam
}) => {
  return (
    <div className="border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50 hover:shadow-lg transition-all duration-300">
      {/* Panel Header */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 cursor-pointer hover:bg-slate-50 transition-colors gap-4 sm:gap-0"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
            {isExpanded ? (
              <ChevronDown className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <ChevronRight className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-bold text-lg sm:text-xl text-slate-800">
                Panel {index + 1}: {panel.facultyNames.join(" & ")}
              </h4>
              {/* ✅ Display venue if available */}
              {panel.venue && (
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  <span>{panel.venue}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-slate-600">
              <span className="flex items-center space-x-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{panel.teams.length} teams assigned</span>
              </span>
              <span className="flex items-center space-x-1">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{panel.department}</span>
              </span>
              {panel.teams.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemovePanel(panel.panelId);
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 text-sm"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            Remove Panel
          </button>
        </div>
      </div>

      {/* Expanded Panel Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50">
          {/* Panel Information */}
          {panel.venue && (
            <div className="mb-6 bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">Venue: {panel.venue}</span>
              </div>
            </div>
          )}
          
          {/* Assigned Teams Section */}
          <div className="mb-8">
            <h5 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-slate-800 flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span>Assigned Teams</span>
            </h5>
            
            {panel.teams.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-center space-x-3 text-amber-800">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                  <div>
                    <span className="font-bold block text-sm sm:text-base">No Teams Assigned</span>
                    <span className="text-xs sm:text-sm text-amber-700">Use the dropdown below to assign teams to this panel</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {panel.teams.map((team) => (
                  <div key={team.id} className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h6 className="font-bold text-base sm:text-lg text-slate-800">{team.name}</h6>
                      <button
                        onClick={() => onRemoveTeam(team.id)}
                        className="text-red-600 hover:text-red-800 p-1.5 sm:p-2 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm font-medium"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        Remove
                      </button>
                    </div>
                    
                    {team.members && team.members.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 space-x-0 sm:space-x-3 p-2 sm:p-3 bg-slate-50 rounded-lg">
                          <span className="font-semibold text-slate-700 text-sm sm:text-base">Team Members:</span>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {team.members.map((member, memberIdx) => (
                              <span
                                key={`${team.id}-member-${memberIdx}`}
                                className="bg-blue-100 text-blue-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs sm:text-sm font-semibold"
                              >
                                {member}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Assignment Section */}
          <div className="border-t border-slate-200 pt-6">
            <h5 className="font-bold text-lg sm:text-xl mb-4 text-slate-800 flex items-center space-x-2">
              <span>Manual Assignment</span>
              <span className="text-xs sm:text-sm font-normal text-slate-500">
                ({availableTeams.length} available)
              </span>
            </h5>
            
            {availableTeams.length === 0 ? (
              <div className="bg-slate-100 p-3 sm:p-4 rounded-xl text-center">
                <span className="text-slate-600 font-medium text-sm sm:text-base">
                  {unassignedTeams.length === 0
                    ? "✅ All teams have been assigned"
                    : "⚠️ No teams available (guide conflicts)"}
                </span>
              </div>
            ) : (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onManualAssign(index, e.target.value);
                    e.target.value = "";
                  }
                }}
                className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                defaultValue=""
              >
                <option value="" disabled>
                  Select team to assign to this panel
                </option>
                {availableTeams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelCard;
