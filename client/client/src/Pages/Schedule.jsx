import Navbar from "../Components/UniversalNavbar";
import { useState, useEffect } from "react";
import { setHours, setMinutes } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDefaultDeadline, createOrUpdateMarkingSchema } from "../api";
import { Plus, Minus, Building2, GraduationCap, CheckCircle, AlertCircle } from "lucide-react";
import { useAdminContext } from '../hooks/useAdminContext';
import { useNavigate } from "react-router-dom";

function Schedule() {
  const { school, department, getDisplayString, clearContext, loading: contextLoading, error: contextError } = useAdminContext();

  // State for each review's from/to dates
  const handleChangeSchoolDepartment = () => {
    sessionStorage.removeItem("adminContext");
    window.location.reload(); 
  };
  
  const defaultDate = setHours(setMinutes(new Date(), 30), 16);
  const navigate = useNavigate();
  
  const [reviewData, setReviewData] = useState({
    draftReview: { from: defaultDate, to: defaultDate },
    review0: { from: defaultDate, to: defaultDate },
    review1: { from: defaultDate, to: defaultDate },
    review2: { from: defaultDate, to: defaultDate },
    review3: { from: defaultDate, to: defaultDate },
    review4: { from: defaultDate, to: defaultDate },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({}); // ✅ NEW: For validation errors

  const [components, setComponents] = useState({
    draftReview: [{ name: "", points: "" }],
    review0: [{ name: "", points: "" }],
    review1: [{ name: "", points: "" }],
    review2: [{ name: "", points: "" }],
    review3: [{ name: "", points: "" }],
    review4: [{ name: "", points: "" }],
  });

  // PPT requirement state for each review
  const [pptRequirements, setPptRequirements] = useState({
    draftReview: false,
    review0: false,
    review1: false,
    review2: false,
    review3: false,
    review4: false,
  });

  const addComponent = (task) => {
    setComponents((prev) => ({
      ...prev,
      [task]: [...prev[task], { name: "", points: "" }],
    }));
    
    // Clear validation error when adding component
    setValidationErrors(prev => ({ ...prev, [task]: false }));
  };

  // ✅ UPDATED: Prevent removing the last component
  const removeComponent = (task, index) => {
    if (components[task].length <= 1) {
      setMessage("Each review must have at least one component.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setComponents((prev) => ({
      ...prev,
      [task]: prev[task].filter((_, i) => i !== index),
    }));
  };

  const updateComponent = (task, index, field, value) => {
    console.log(`Updating ${task}[${index}].${field} = ${value}`);
    
    setComponents((prev) => {
      const updatedComponents = [...prev[task]];
      updatedComponents[index] = { ...updatedComponents[index], [field]: value };
      
      console.log(`Updated ${task} components:`, updatedComponents);
      
      return { ...prev, [task]: updatedComponents };
    });

    // Clear validation error when updating component name
    if (field === 'name' && value.trim()) {
      setValidationErrors(prev => ({ ...prev, [task]: false }));
    }
  };

  // Handle PPT requirement changes
  const handlePPTRequirementChange = (reviewKey, requiresPPT) => {
    setPptRequirements(prev => ({
      ...prev,
      [reviewKey]: requiresPPT
    }));
  };

  useEffect(() => {
    if (!contextLoading && (!school || !department)) {
      console.log("Admin context missing, redirecting to school selection");
      navigate("/admin/school-selection");
    }
  }, [contextLoading, school, department, navigate]);

  // Fetch deadlines when admin context is available
  useEffect(() => {
    if (school && department) {
      fetchDeadlines();
    }
  }, [school, department]);

  // Data fetching function
  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      console.log(`Fetching deadlines for ${school} - ${department}`);
      
      const res = await getDefaultDeadline(school, department);
      console.log('Full API Response:', res.data);

      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        console.log('Processing data:', data);

        const newReviewData = { ...reviewData };
        const newComponents = {};
        const newPptRequirements = { ...pptRequirements };

        Object.keys(components).forEach(reviewType => {
          newComponents[reviewType] = [{ name: "", points: "" }];
        });

        if (data.reviews && Array.isArray(data.reviews)) {
          console.log("Processing full marking schema with components:", data.reviews);
          
          data.reviews.forEach((review) => {
            const reviewName = review.reviewName;
            console.log(`Processing review: ${reviewName}`, review);
            
            if (newReviewData.hasOwnProperty(reviewName)) {
              if (review.deadline) {
                newReviewData[reviewName] = {
                  from: new Date(review.deadline.from),
                  to: new Date(review.deadline.to),
                };
                console.log(`Updated deadline for ${reviewName}:`, newReviewData[reviewName]);
              }

              if (review.components && Array.isArray(review.components) && review.components.length > 0) {
                console.log(`Processing ${review.components.length} components for ${reviewName}:`, review.components);
                
                newComponents[reviewName] = review.components.map((comp, index) => {
                  console.log(`Component ${index}:`, comp);
                  
                  let points = "";
                  if (comp.weight !== undefined && comp.weight !== null) {
                    points = comp.weight.toString();
                  } else if (comp.points !== undefined && comp.points !== null) {
                    points = comp.points.toString();
                  }
                  
                  console.log(`Mapped component: name="${comp.name}", points="${points}"`);
                  
                  return {
                    name: comp.name || "",
                    points: points
                  };
                });
                
                console.log(`Final components for ${reviewName}:`, newComponents[reviewName]);
              } else {
                console.log(`No components found for ${reviewName}, using default empty component`);
                newComponents[reviewName] = [{ name: "", points: "" }];
              }

              if (review.hasOwnProperty('requiresPPT')) {
                newPptRequirements[reviewName] = Boolean(review.requiresPPT);
                console.log(`PPT requirement for ${reviewName}: ${newPptRequirements[reviewName]}`);
              }
            } else {
              console.log(`Skipping unknown review type: ${reviewName}`);
            }
          });
          
          setMessage("Existing marking schema loaded successfully!");
        } 
        else if (data.deadlines && Array.isArray(data.deadlines)) {
          console.log("Processing deadlines-only data:", data.deadlines);
          
          data.deadlines.forEach(item => {
            if (newReviewData.hasOwnProperty(item.reviewName) && item.deadline) {
              newReviewData[item.reviewName] = {
                from: new Date(item.deadline.from),
                to: new Date(item.deadline.to),
              };
            }
          });
          
          setMessage("Existing deadlines loaded successfully!");
        }

        console.log('=== FINAL PROCESSED DATA ===');
        console.log('Review Data:', newReviewData);
        console.log('Components:', newComponents);
        console.log('PPT Requirements:', newPptRequirements);

        setReviewData(newReviewData);
        setComponents(newComponents);
        setPptRequirements(newPptRequirements);
        
      } else {
        console.log("No existing data found or API returned empty data");
        setMessage("No existing marking schema found. You can create new ones.");
      }
    } catch (err) {
      console.error("Error fetching deadlines:", err);
      
      if (err.response?.status === 404) {
        console.log("404 - No marking schema found, this is normal for first time setup");
        setMessage("No existing marking schema found. You can create new ones.");
      } else {
        console.error("Actual error fetching data:", err);
        setMessage("Error loading existing data. You can still create a new marking schema.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Enhanced validation for components
  const handleSaveDeadlines = async () => {
    if (!school || !department) {
      setMessage("Admin context is required. Please select school and department.");
      return;
    }

    setSaving(true);
    setMessage("");
    setValidationErrors({}); // Clear previous validation errors

    // Validate dates
    const dateValidation = Object.entries(reviewData).every(([reviewName, dates]) => {
      return dates.to > dates.from;
    });

    if (!dateValidation) {
      setMessage("Please ensure all 'To' dates are after their corresponding 'From' dates.");
      setSaving(false);
      return;
    }

    // ✅ NEW: Validate that each review has at least one component with a name
    const componentValidation = {};
    let hasValidationErrors = false;

    Object.entries(components).forEach(([reviewName, reviewComponents]) => {
      const validComponents = reviewComponents.filter(comp => comp.name && comp.name.trim());
      
      if (validComponents.length === 0) {
        componentValidation[reviewName] = true;
        hasValidationErrors = true;
      }
    });

    if (hasValidationErrors) {
      setValidationErrors(componentValidation);
      setMessage("Each review must have at least one component with a name. Please check the highlighted reviews.");
      setSaving(false);
      return;
    }

    try {
      console.log("=== SAVING COMPLETE MARKING SCHEMA ===");

      const reviews = Object.entries(reviewData).map(([reviewName, dates]) => {
        const reviewComponents = components[reviewName] || [];
        
        const processedComponents = reviewComponents
          .filter(comp => comp.name && comp.name.trim())
          .map(comp => {
            const weight = parseInt(comp.points) || 0;
            console.log(`Component: "${comp.name.trim()}" -> Weight: ${weight}`);
            return {
              name: comp.name.trim(),
              weight: weight
            };
          });

        return {
          reviewName,
          components: processedComponents,
          deadline: {
            from: dates.from.toISOString(),
            to: dates.to.toISOString(),
          },
          requiresPPT: pptRequirements[reviewName] || false,
        };
      });

      console.log("Final reviews payload:", JSON.stringify(reviews, null, 2));

      const response = await createOrUpdateMarkingSchema({ 
        school, 
        department, 
        reviews 
      });

      if (response.data?.success) {
        setMessage(`Complete marking schema saved successfully for ${getDisplayString()}!`);
        
        setTimeout(() => {
          fetchDeadlines();
        }, 1000);
      } else {
        throw new Error(response.data?.message || "Failed to save");
      }

    } catch (error) {
      console.error("Save error:", error);
      setMessage(error.response?.data?.message || "Failed to save marking schema. Please try again.");
    }

    setSaving(false);
  };

  // Update review date handler
  const updateReviewDate = (reviewName, field, value) => {
    setReviewData(prev => ({
      ...prev,
      [reviewName]: {
        ...prev[reviewName],
        [field]: value,
      }
    }));
  };

  // Context loading and error handling
  if (contextLoading) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">Loading admin context...</div>
        </div>
      </>
    );
  }

  if (contextError) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl text-red-600">Context Error: {contextError}</div>
        </div>
      </>
    );
  }

  const reviewTypes = [
    { key: 'draftReview', label: 'Draft Review' },
    { key: 'review0', label: 'Review 0' },
    { key: 'review1', label: 'Review 1' },
    { key: 'review2', label: 'Review 2' },
    { key: 'review3', label: 'Review 3' },
    { key: 'review4', label: 'Review 4' },
  ];

  return (
    <>
      <Navbar userType="admin" />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header with Admin Context */}
          <div className="mb-8 pt-10">
            <div className="flex justify-stretch items-center gap-96">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Schedule Management</h1>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between gap-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {getDisplayString()}
                    </span>
                  </div>
                  <button
                    onClick={handleChangeSchoolDepartment}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Change School/Department
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-4 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <div className="text-lg text-gray-600">Loading existing marking schema...</div>
              </div>
            )}

            {/* Error/Success Messages */}
            {message && (
              <div className={`p-4 rounded-lg mb-6 border ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : message.includes('Error') || message.includes('Failed') || message.includes('must have at least one')
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <div className="flex items-center">
                  {message.includes('successfully') ? (
                    <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-green-600" />
                  ) : message.includes('Error') || message.includes('Failed') || message.includes('must have at least one') ? (
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 text-red-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-blue-600" />
                  )}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Configuration Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Review Deadlines & Marking Components</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure deadlines, marking components, and PPT requirements for {getDisplayString()}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">From Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">To Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-80">Components</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">PPT Required</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviewTypes.map((review) => (
                    <tr key={review.key} className={`hover:bg-gray-50 ${
                      validationErrors[review.key] ? 'bg-red-50 border-l-4 border-red-400' : ''
                    }`}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {validationErrors[review.key] && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {review.label}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <DatePicker
                          selected={reviewData[review.key].from}
                          onChange={(date) => updateReviewDate(review.key, 'from', date)}
                          showTimeSelect
                          timeIntervals={15}
                          dateFormat="MMMM d, yyyy h:mm aa"
                          className="border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <DatePicker
                          selected={reviewData[review.key].to}
                          onChange={(date) => updateReviewDate(review.key, 'to', date)}
                          showTimeSelect
                          timeIntervals={15}
                          dateFormat="MMMM d, yyyy h:mm aa"
                          className="border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          {components[review.key].map((comp, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={comp.name}
                                onChange={(e) => updateComponent(review.key, index, "name", e.target.value)}
                                placeholder="Component Name"
                                className={`flex-1 border-2 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                                  validationErrors[review.key] && !comp.name.trim() 
                                    ? 'border-red-300 focus:border-red-500' 
                                    : 'border-gray-300 focus:border-blue-500'
                                }`}
                              />
                              <input
                                type="number"
                                value={comp.points}
                                onChange={(e) => {
                                  console.log(`Points input changed for ${review.key}[${index}]: ${e.target.value}`);
                                  updateComponent(review.key, index, "points", e.target.value);
                                }}
                                placeholder="Points"
                                className="w-20 border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                              <button
                                onClick={() => removeComponent(review.key, index)}
                                className={`p-2 rounded-lg transition-colors ${
                                  components[review.key].length === 1
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                }`}
                                disabled={components[review.key].length === 1}
                                title={components[review.key].length === 1 ? 'Cannot remove the last component' : 'Remove component'}
                              >
                                <Minus size={16} />
                              </button>
                            </div>
                          ))}
                          {validationErrors[review.key] && (
                            <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              At least one component with a name is required
                            </div>
                          )}
                        </div>
                      </td>
                      {/* PPT Requirement Column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pptRequirements[review.key] || false}
                              onChange={(e) => handlePPTRequirementChange(review.key, e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`relative inline-flex items-center justify-center w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out ${
                              pptRequirements[review.key] ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              <div className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                                pptRequirements[review.key] ? 'translate-x-3' : 'translate-x-1'
                              }`} />
                            </div>
                            {pptRequirements[review.key] && (
                              <CheckCircle size={16} className="ml-2 text-green-600" />
                            )}
                          </label>
                        </div>
                        <div className="text-center mt-1">
                          <span className={`text-xs font-medium ${
                            pptRequirements[review.key] ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {pptRequirements[review.key] ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => addComponent(review.key)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save Button Section */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>PPT Required: Reviews marked will show PPT approval section in Guide interface</span>
                  </p>
                  <p className="flex items-center gap-2 mt-1">
                    <AlertCircle size={16} className="text-orange-600" />
                    <span>Each review must have at least one component with a name</span>
                  </p>
                </div>
                <button
                  onClick={handleSaveDeadlines}
                  disabled={saving || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save Marking Schema"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Marking Schema Configuration</h3>
            <div className="text-sm text-blue-800">
              <p className="mb-2">Configure your marking schema:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Components:</strong> Define what gets marked in each review (e.g., "Presentation", "Demo")</li>
                <li><strong>Points:</strong> Set the maximum points for each component</li>
                <li><strong>PPT Required:</strong> Enable PPT approval section for specific reviews</li>
                <li><strong>Deadlines:</strong> Set when each review period is active</li>
                <li><strong>Validation:</strong> Each review must have at least one component with a name</li>
                <li><strong>Auto-refresh:</strong> Data is reloaded after successful save to verify changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Schedule;
