import Navbar from "../Components/UniversalNavbar";
import React, { useState, useEffect, useCallback } from "react";
import { setHours, setMinutes } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDefaultDeadline, createOrUpdateMarkingSchema } from "../api";
import { 
  Plus, 
  Minus, 
  Building2, 
  GraduationCap, 
  CheckCircle, 
  XCircle,
  AlertTriangle, 
  Users, 
  Trash2, 
  Calculator, 
  Target, 
  TrendingUp,
  Clock,
  Settings,
  Database,
  CalendarDays,
  BookOpen,
  X
} from "lucide-react";

function Schedule() {
  const defaultDate = setHours(setMinutes(new Date(), 30), 16);
  
  // School and Department options
  const schoolOptions = ['SCOPE', 'SENSE', 'SELECT', 'SMEC', 'SCE'];
  const departmentOptions = [
    'BTech', 'M.Tech Integrated (MIS)', 'M.Tech Integrated (MIA)', 'MCA 1st Year', 
      'MCA', 'M.Tech 2yr (MCS,MCB,MAI)','M.Tech 2yrs (1st years)'];

  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // NEW: Department-level requiresContribution
  const [requiresContribution, setRequiresContribution] = useState(false);

  // State for Guide Reviews - REMOVED requiresContribution from each review
  const [guideReviews, setGuideReviews] = useState([
    {
      id: 'guide-draftReview',
      reviewName: 'draftReview',
      displayName: 'Draft Review',
      facultyType: 'guide',
      from: defaultDate,
      to: defaultDate,
      components: [{ name: '', weight: '' }],
    }
  ]);

  // State for Panel Reviews - REMOVED requiresContribution from each review
  const [panelReviews, setPanelReviews] = useState([
    {
      id: 'panel-review0', 
      reviewName: 'review0',
      displayName: 'Review 0',
      facultyType: 'panel',
      from: defaultDate,
      to: defaultDate,
      components: [{ name: '', weight: '' }],
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [notification, setNotification] = useState({
    isVisible: false,
    type: "",
    title: "",
    message: "",
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Show notification function
  const showNotification = useCallback((type, title, message, duration = 4000) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message,
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, duration);
  }, []);

  // Hide notification function
  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Calculate total weight across all reviews and components
  const calculateTotalWeight = () => {
    const allReviews = [...guideReviews, ...panelReviews];
    return allReviews.reduce((total, review) => {
      return total + review.components.reduce((reviewTotal, component) => {
        return reviewTotal + (parseInt(component.weight) || 0);
      }, 0);
    }, 0);
  };

  const totalWeight = calculateTotalWeight();
  const canAddReview = totalWeight < 100;
  const canSave = totalWeight === 100;
  
  // Show weight tracker only when school and department are selected
  const shouldShowWeightTracker = selectedSchool && selectedDepartment;

  // Calculate weights for each review type
  const guideWeight = guideReviews.reduce((total, review) => {
    return total + review.components.reduce((reviewTotal, component) => {
      return reviewTotal + (parseInt(component.weight) || 0);
    }, 0);
  }, 0);

  const panelWeight = panelReviews.reduce((total, review) => {
    return total + review.components.reduce((reviewTotal, component) => {
      return reviewTotal + (parseInt(component.weight) || 0);
    }, 0);
  }, 0);

  // Add new guide review - REMOVED requiresContribution
  const addGuideReview = () => {
    if (!canAddReview) {
      showNotification('error', 'Cannot Add Review', 'Total weight would exceed 100 marks.');
      return;
    }

    const newReview = {
      id: `guide-${Date.now()}`,
      reviewName: `guideReview${guideReviews.length}`,
      displayName: `Guide Review ${guideReviews.length + 1}`,
      facultyType: 'guide',
      from: defaultDate,
      to: defaultDate,
      components: [{ name: '', weight: '' }],
    };

    setGuideReviews([...guideReviews, newReview]);
  };

  // Add new panel review - REMOVED requiresContribution
  const addPanelReview = () => {
    if (!canAddReview) {
      showNotification('error', 'Cannot Add Review', 'Total weight would exceed 100 marks.');
      return;
    }

    const newReview = {
      id: `panel-${Date.now()}`,
      reviewName: `panelReview${panelReviews.length}`, 
      displayName: `Panel Review ${panelReviews.length + 1}`,
      facultyType: 'panel',
      from: defaultDate,
      to: defaultDate,
      components: [{ name: '', weight: '' }],
    };

    setPanelReviews([...panelReviews, newReview]);
  };

  // Remove guide review
  const removeGuideReview = (reviewId) => {
    if (guideReviews.length <= 1) {
      showNotification("error", "Cannot Remove", "Must have at least one guide review.");
      return;
    }
    setGuideReviews(guideReviews.filter(review => review.id !== reviewId));
  };

  // Remove panel review
  const removePanelReview = (reviewId) => {
    if (panelReviews.length <= 1) {
      showNotification("error", "Cannot Remove", "Must have at least one panel review.");
      return;
    }
    setPanelReviews(panelReviews.filter(review => review.id !== reviewId));
  };

  // Update review field
  const updateReview = (reviewType, reviewId, field, value) => {
    const updateFunction = reviewType === 'guide' ? setGuideReviews : setPanelReviews;
    const reviews = reviewType === 'guide' ? guideReviews : panelReviews;
    
    updateFunction(reviews.map(review => 
      review.id === reviewId ? { ...review, [field]: value } : review
    ));
  };

  // Add component to review
  const addComponent = (reviewType, reviewId) => {
    const updateFunction = reviewType === 'guide' ? setGuideReviews : setPanelReviews;
    const reviews = reviewType === 'guide' ? guideReviews : panelReviews;
    
    updateFunction(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, components: [...review.components, { name: "", weight: "" }] }
        : review
    ));
  };

  // Remove component from review
  const removeComponent = (reviewType, reviewId, componentIndex) => {
    const updateFunction = reviewType === 'guide' ? setGuideReviews : setPanelReviews;
    const reviews = reviewType === 'guide' ? guideReviews : panelReviews;
    
    const review = reviews.find(r => r.id === reviewId);
    if (review.components.length <= 1) {
      showNotification("error", "Cannot Remove", "Each review must have at least one component.");
      return;
    }
    
    updateFunction(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, components: review.components.filter((_, i) => i !== componentIndex) }
        : review
    ));
  };

  // Update component in review with validation for weight
  const updateComponent = (reviewType, reviewId, componentIndex, field, value) => {
    const updateFunction = reviewType === 'guide' ? setGuideReviews : setPanelReviews;
    const reviews = reviewType === 'guide' ? guideReviews : panelReviews;
    
    // Validate weight field
    if (field === 'weight') {
      const numValue = parseInt(value);
      // Don't allow values above 100 or negative values
      if (value && (numValue > 100 || numValue < 0)) {
        showNotification("error", "Invalid Weight", `Weight cannot exceed 100 or be negative. Current value: ${numValue}`);
        return;
      }
    }
    
    updateFunction(reviews.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            components: review.components.map((comp, i) => 
              i === componentIndex ? { ...comp, [field]: value } : comp
            ) 
          }
        : review
    ));
  };

  // Fetch deadlines when school and department are selected
  useEffect(() => {
    if (selectedSchool && selectedDepartment) {
      fetchDeadlines(selectedSchool, selectedDepartment);
    }
  }, [selectedSchool, selectedDepartment]);

  // Data fetching function
  const fetchDeadlines = async (school, department) => {
    setLoading(true);
    try {
      console.log(`Fetching deadlines for ${school} - ${department}`);
      
      const res = await getDefaultDeadline(school, department);
      console.log('Full API Response:', res.data);

      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        console.log('Processing data:', data);

        // NEW: Set department-level requiresContribution
        if (data.requiresContribution !== undefined) {
          setRequiresContribution(Boolean(data.requiresContribution));
          console.log('Set requiresContribution:', data.requiresContribution);
        }

        if (data.reviews && Array.isArray(data.reviews)) {
          console.log("Processing reviews:", data.reviews);
          
          const newGuideReviews = [];
          const newPanelReviews = [];
          
          data.reviews.forEach(review => {
            const reviewData = {
              id: `${review.facultyType}-${review.reviewName}`,
              reviewName: review.reviewName,
              displayName: review.displayName || review.reviewName,
              facultyType: review.facultyType || 'guide',
              from: review.deadline ? new Date(review.deadline.from) : defaultDate,
              to: review.deadline ? new Date(review.deadline.to) : defaultDate,
              components: review.components && review.components.length > 0 
                ? review.components.map(comp => ({ 
                    name: comp.name || '', 
                    weight: comp.weight ? comp.weight.toString() : '' 
                  }))
                : [{ name: '', weight: '' }],
              // REMOVED: requiresContribution from review level
            };
            
            if (review.facultyType === 'panel') {
              newPanelReviews.push(reviewData);
            } else {
              newGuideReviews.push(reviewData);
            }
          });

          if (newGuideReviews.length > 0) setGuideReviews(newGuideReviews);
          if (newPanelReviews.length > 0) setPanelReviews(newPanelReviews);
          
          showNotification("success", "Schema Loaded", "Existing marking schema loaded successfully!");
        } else {
          showNotification("info", "No Existing Schema", "No existing marking schema found. You can create new ones.");
        }
      }
    } catch (err) {
      console.error("Error fetching deadlines:", err);
      if (err.response?.status === 404) {
        showNotification("info", "No Existing Schema", "No existing marking schema found. You can create new ones.");
      } else {
        showNotification("error", "Load Failed", "Error loading existing data. You can still create a new marking schema.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Save marking schema
// Save marking schema
const handleSaveDeadlines = async () => {
  if (!selectedSchool || !selectedDepartment) {
    showNotification("error", "Missing Selection", "Please select both school and department.");
    return;
  }

  if (!canSave) {
    showNotification("error", "Invalid Weight", `Total weight must be exactly 100. Current total: ${totalWeight}`);
    return;
  }

  setSaving(true);
  setValidationErrors({});

  try {
    console.log("=== SAVING COMPLETE MARKING SCHEMA ===");

    const allReviews = [...guideReviews, ...panelReviews];
    
    const reviews = allReviews.map(review => ({
      reviewName: review.reviewName,
      displayName: review.displayName,
      facultyType: review.facultyType,
      components: review.components
        .filter(comp => comp.name && comp.name.trim())
        .map(comp => ({
          name: comp.name.trim(),
          weight: parseInt(comp.weight) || 0
        })),
      deadline: {
        from: review.from.toISOString(),
        to: review.to.toISOString()
      },
      pptApproved: {
        approved: false,
        locked: false
      }
    }));

    // FIXED: Build the payload correctly at the root level
    const payload = {
      school: selectedSchool,
      department: selectedDepartment,
      reviews: reviews,
      requiresContribution: requiresContribution // ✅ At root level, not nested
    };

    console.log("Final payload to API:", JSON.stringify(payload, null, 2));

    // FIXED: Send the payload directly, not wrapped in a data object
    const response = await createOrUpdateMarkingSchema(payload);

    if (response.data?.success) {
      setSaving(false);
      setJustSaved(true);
      
      showNotification("success", "Schema Saved", `Complete marking schema saved successfully for ${selectedSchool} - ${selectedDepartment}!`);
      
      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
      
      setTimeout(() => {
        fetchDeadlines(selectedSchool, selectedDepartment);
      }, 1000);
    } else {
      throw new Error(response.data?.message || "Failed to save");
    }

  } catch (error) {
    console.error("Save error:", error);
    showNotification("error", "Save Failed", error.response?.data?.message || "Failed to save marking schema. Please try again.");
    setSaving(false);
  }
};


  // Render review section - REMOVED requiresContribution checkbox
  const renderReviewSection = (reviews, reviewType, addFunction, removeFunction, title, icon, sectionWeight) => {
    const disabled = !selectedSchool || !selectedDepartment;

    return (
      <div className="mb-6 sm:mb-8 mx-4 sm:mx-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${
            reviewType === 'guide' 
              ? 'from-blue-600 via-indigo-600 to-purple-600' 
              : 'from-purple-600 via-pink-600 to-red-600'
          } px-4 sm:px-8 py-4 sm:py-6`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  {React.cloneElement(icon, { className: 'h-5 w-5 sm:h-6 sm:w-6 text-white' })}
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white">{title}</h3>
                  <div className="flex items-center space-x-3 sm:space-x-4 mt-1">
                    <span className="text-white/90 text-xs sm:text-sm">
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </span>
                    {shouldShowWeightTracker && (
                      <span className="bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 text-white/90 text-xs sm:text-sm font-medium">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                        {sectionWeight} marks
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={addFunction}
                disabled={disabled || !canAddReview}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto ${
                  disabled || !canAddReview
                    ? 'bg-white/20 text-white/50 cursor-not-allowed'
                    : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                }`}
                title={!canAddReview ? `Cannot add more reviews. Total weight: ${totalWeight}/100` : ''}
              >
                <Plus className="h-4 w-4" />
                <span>Add Review</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className={`bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 ${disabled ? 'opacity-50' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full">
                      <input
                        type="text"
                        value={review.displayName}
                        onChange={(e) => updateReview(reviewType, review.id, 'displayName', e.target.value)}
                        disabled={disabled}
                        className="text-base sm:text-lg font-bold text-slate-800 border-2 border-slate-200 px-3 sm:px-4 py-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
                        placeholder="Review Name"
                      />
                      {/* REMOVED: Contribution Required checkbox from review level */}
                    </div>
                    <button
                      onClick={() => removeFunction(review.id)}
                      disabled={disabled || reviews.length <= 1}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 sm:p-3 rounded-lg transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">From Date</label>
                      <DatePicker
                        selected={review.from}
                        onChange={(date) => updateReview(reviewType, review.id, 'from', date)}
                        disabled={disabled}
                        showTimeSelect
                        timeIntervals={15}
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full border-2 border-slate-200 p-2 sm:p-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">To Date</label>
                      <DatePicker
                        selected={review.to}
                        onChange={(date) => updateReview(reviewType, review.id, 'to', date)}
                        disabled={disabled}
                        showTimeSelect
                        timeIntervals={15}
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full border-2 border-slate-200 p-2 sm:p-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center space-x-2">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Components</span>
                      </label>
                      <button
                        onClick={() => addComponent(reviewType, review.id)}
                        disabled={disabled}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 sm:p-2 rounded-lg transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {review.components.map((component, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 space-x-0 sm:space-x-3 p-3 sm:p-4 bg-slate-50 rounded-lg">
                          <input
                            type="text"
                            value={component.name}
                            onChange={(e) => updateComponent(reviewType, review.id, index, 'name', e.target.value)}
                            disabled={disabled}
                            placeholder="Component Name"
                            className="flex-1 border-2 border-slate-200 p-2 sm:p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                          />
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <input
                              type="number"
                              value={component.weight}
                              onChange={(e) => updateComponent(reviewType, review.id, index, 'weight', e.target.value)}
                              onWheel={(e) => e.target.blur()}
                              disabled={disabled}
                              placeholder="Weight"
                              min="0"
                              max="100"
                              className="w-20 border-2 border-slate-200 p-2 sm:p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center font-bold text-sm sm:text-base"
                              style={{ 
                                MozAppearance: 'textfield',
                                WebkitAppearance: 'none'
                              }}
                            />
                            <span className="text-xs sm:text-sm font-medium text-slate-500">marks</span>
                          </div>
                          <button
                            onClick={() => removeComponent(reviewType, review.id, index)}
                            disabled={disabled || review.components.length === 1}
                            className={`p-1 sm:p-2 rounded-lg transition-colors ${
                              disabled || review.components.length === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            }`}
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">Loading Schedule Configuration</h3>
            <p className="text-sm sm:text-base text-slate-600">Retrieving existing marking schema and deadlines...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 mx-4 sm:mx-8 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-white">Schedule Management</h1>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">Configure review schedules and marking components</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mx-4 sm:mx-10 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Guide Reviews</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{guideReviews.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Panel Reviews</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{panelReviews.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* School/Department Selector with Department-level requiresContribution */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Select Faculty's School & Department</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                  School <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
                  required
                >
                  <option value="">Select School</option>
                  {schoolOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
                  required
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* NEW: Department-level Contribution Required checkbox */}
            {selectedSchool && selectedDepartment && (
              <div className="mt-6 pt-6 border-t-2 border-slate-200">
                <div className="flex items-center space-x-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border-2 border-purple-200">
                  <input
                    type="checkbox"
                    id="dept-contribution"
                    checked={requiresContribution}
                    onChange={(e) => setRequiresContribution(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="dept-contribution" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-slate-800 text-base">Contribution Required for This Department</div>
                    <div className="text-sm text-slate-600 mt-1">
                      Enable this to require contribution section for all students in {selectedDepartment}
                    </div>
                  </label>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conditional Weight Summary */}
        {shouldShowWeightTracker && (
          <div className="fixed top-20 sm:top-28 right-4 sm:right-8 z-50">
            <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl border-2 backdrop-blur-sm transition-all duration-300 ${
              totalWeight === 100 
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-800'
                : totalWeight > 100 
                  ? 'bg-red-50/90 border-red-300 text-red-800'
                  : 'bg-blue-50/90 border-blue-300 text-blue-800'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-1 sm:p-2 rounded-xl ${
                  totalWeight === 100 
                    ? 'bg-emerald-100' 
                    : totalWeight > 100 
                      ? 'bg-red-100' 
                      : 'bg-blue-100'
                }`}>
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <div className="font-bold text-base sm:text-lg">Total Weight: {totalWeight}/100</div>
                  <div className="text-xs sm:text-sm opacity-80">
                    Guide: {guideWeight} • Panel: {panelWeight}
                  </div>
                </div>
              </div>
              {totalWeight !== 100 && (
                <div className="text-xs sm:text-sm mt-2 opacity-90">
                  {totalWeight < 100 ? `Need ${100 - totalWeight} more marks` : `Exceeded by ${totalWeight - 100} marks`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selection Prompt */}
        {!selectedSchool || !selectedDepartment ? (
          <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
            <div className="bg-white rounded-2xl shadow-lg">
              <div className="text-center py-12 sm:py-20 px-4">
                <div className="mx-auto w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 sm:mb-8">
                  <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-600 mb-3">Choose School & Department</h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-sm sm:max-w-md mx-auto">
                  Please select a school and department above to configure schedules and marking components.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Guide Reviews Section */}
            {renderReviewSection(
              guideReviews,
              'guide',
              addGuideReview,
              removeGuideReview,
              'Guide Reviews',
              <GraduationCap className="h-6 w-6 text-white" />,
              guideWeight
            )}

            {/* Panel Reviews Section */}
            {renderReviewSection(
              panelReviews,
              'panel',
              addPanelReview,
              removePanelReview,
              'Panel Reviews',
              <Users className="h-6 w-6 text-white" />,
              panelWeight
            )}

            {/* Save Button */}
            <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
              <div className="flex justify-center">
                <button
                  onClick={handleSaveDeadlines}
                  disabled={saving || loading || !canSave || justSaved}
                  className={`px-8 sm:px-12 py-3 sm:py-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 font-bold text-base sm:text-xl shadow-2xl hover:shadow-3xl w-full sm:w-auto ${
                    justSaved
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-600 text-white transform scale-105'
                      : canSave && !saving && !loading
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-slate-400 text-slate-600 cursor-not-allowed'
                  }`}
                  title={!canSave ? `Total weight must be exactly 100. Current: ${totalWeight}` : ''}
                >
                  {saving ? (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                      <span>Saving Schema...</span>
                    </div>
                  ) : justSaved ? (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
                      <span>Saved Successfully!</span>
                    </div>
                  ) : (
                    `Save Complete Schema (${totalWeight}/100)`
                  )}
                </button>
              </div>
            </div>

            {/* Enhanced Weight Distribution Info */}
            <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-8 shadow-lg">
                <h3 className="text-lg sm:text-2xl font-bold text-blue-900 mb-4 sm:mb-6 flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <span>Weight Distribution Rules</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm text-blue-800">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Total Weight:</strong> Must equal exactly 100 marks across all components</div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Weight Limits:</strong> Individual component weights must be between 0-100</div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Components:</strong> Each review must have at least one component with a name</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Review Limits:</strong> Cannot add new reviews if total weight reaches/exceeds 100</div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Contribution Required:</strong> Applies to ALL students in the selected department</div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Faculty Types:</strong> Reviews are mapped to either 'guide' or 'panel' faculty</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Enhanced Notification */}
        {notification.isVisible && (
          <div className="fixed top-20 sm:top-24 right-4 sm:right-8 z-50 max-w-xs sm:max-w-md w-full">
            <div className={`transform transition-all duration-500 ease-out ${
              notification.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}>
              <div className={`rounded-xl shadow-2xl border-l-4 p-4 sm:p-6 ${
                notification.type === "success" 
                  ? "bg-emerald-50 border-emerald-400"
                  : notification.type === "error"
                  ? "bg-red-50 border-red-400"
                  : "bg-blue-50 border-blue-400"
              }`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${
                    notification.type === "success" 
                      ? "text-emerald-500" 
                      : notification.type === "error"
                      ? "text-red-500"
                      : "text-blue-500"
                  }`}>
                    {notification.type === "success" ? (
                      <div className="relative">
                        <div className="animate-ping absolute inline-flex h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-400 opacity-75"></div>
                        <CheckCircle className="relative inline-flex h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    ) : notification.type === "error" ? (
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1">
                    <h3 className={`text-xs sm:text-sm font-bold ${
                      notification.type === "success" 
                        ? "text-emerald-800" 
                        : notification.type === "error"
                        ? "text-red-800"
                        : "text-blue-800"
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`mt-1 text-xs sm:text-sm ${
                      notification.type === "success" 
                        ? "text-emerald-700" 
                        : notification.type === "error"
                        ? "text-red-700"
                        : "text-blue-700"
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                  <button
                    onClick={hideNotification}
                    className={`flex-shrink-0 ml-3 ${
                      notification.type === "success" 
                        ? "text-emerald-400 hover:text-emerald-600" 
                        : notification.type === "error"
                        ? "text-red-400 hover:text-red-600"
                        : "text-blue-400 hover:text-blue-600"
                    } transition-colors`}
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Schedule;
