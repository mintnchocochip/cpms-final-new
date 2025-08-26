import Navbar from "../Components/UniversalNavbar";
import { useState, useEffect } from "react";
import { setHours, setMinutes } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDefaultDeadline, createOrUpdateMarkingSchema } from "../api";
import { Plus, Minus, Building2, GraduationCap, CheckCircle, AlertCircle, Users, Trash2, Calculator, Target, TrendingUp } from "lucide-react";

function Schedule() {
  const defaultDate = setHours(setMinutes(new Date(), 30), 16);
  
  // School and Department options
  const schoolOptions = ['SCOPE', 'SENSE', 'SELECT', 'SMEC', 'SCE'];
  const departmentOptions = ['BTech', 'MTech (Integrated)', 'MCA'];

  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // State for Guide Reviews
  const [guideReviews, setGuideReviews] = useState([
    {
      id: 'guide-draftReview',
      reviewName: 'draftReview',
      displayName: 'Draft Review',
      facultyType: 'guide',
      from: defaultDate,
      to: defaultDate,
      components: [{ name: "", weight: "" }],
      requiresPPT: false
    }
  ]);

  // State for Panel Reviews
  const [panelReviews, setPanelReviews] = useState([
    {
      id: 'panel-review0',
      reviewName: 'review0',
      displayName: 'Review 0',
      facultyType: 'panel',
      from: defaultDate,
      to: defaultDate,
      components: [{ name: "", weight: "" }],
      requiresPPT: false
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

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

  // Add new guide review
  const addGuideReview = () => {
    if (!canAddReview) {
      setMessage("Cannot add more reviews. Total weight would exceed 100 marks.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    const newReview = {
      id: `guide-${Date.now()}`,
      reviewName: `guideReview${guideReviews.length}`,
      displayName: `Guide Review ${guideReviews.length + 1}`,
      facultyType: 'guide',
      from: defaultDate,
      to: defaultDate,
      components: [{ name: "", weight: "" }],
      requiresPPT: false
    };
    setGuideReviews([...guideReviews, newReview]);
  };

  // Add new panel review
  const addPanelReview = () => {
    if (!canAddReview) {
      setMessage("Cannot add more reviews. Total weight would exceed 100 marks.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    const newReview = {
      id: `panel-${Date.now()}`,
      reviewName: `panelReview${panelReviews.length}`,
      displayName: `Panel Review ${panelReviews.length + 1}`,
      facultyType: 'panel',
      from: defaultDate,
      to: defaultDate,
      components: [{ name: "", weight: "" }],
      requiresPPT: false
    };
    setPanelReviews([...panelReviews, newReview]);
  };

  // Remove guide review
  const removeGuideReview = (reviewId) => {
    if (guideReviews.length <= 1) {
      setMessage("Must have at least one guide review.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setGuideReviews(guideReviews.filter(review => review.id !== reviewId));
  };

  // Remove panel review
  const removePanelReview = (reviewId) => {
    if (panelReviews.length <= 1) {
      setMessage("Must have at least one panel review.");
      setTimeout(() => setMessage(""), 3000);
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
      setMessage("Each review must have at least one component.");
      setTimeout(() => setMessage(""), 3000);
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
        setMessage(`Weight cannot exceed 100 or be negative. Current value: ${numValue}`);
        setTimeout(() => setMessage(""), 3000);
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

        if (data.reviews && Array.isArray(data.reviews)) {
          console.log("Processing reviews:", data.reviews);
          
          const newGuideReviews = [];
          const newPanelReviews = [];
          
          data.reviews.forEach((review) => {
            const reviewData = {
              id: `${review.facultyType || 'guide'}-${review.reviewName}`,
              reviewName: review.reviewName,
              displayName: review.displayName || review.reviewName,
              facultyType: review.facultyType || 'guide',
              from: review.deadline ? new Date(review.deadline.from) : defaultDate,
              to: review.deadline ? new Date(review.deadline.to) : defaultDate,
              components: review.components && review.components.length > 0 
                ? review.components.map(comp => ({
                    name: comp.name || "",
                    weight: comp.weight ? comp.weight.toString() : ""
                  }))
                : [{ name: "", weight: "" }],
              requiresPPT: Boolean(review.requiresPPT)
            };

            if (review.facultyType === 'panel') {
              newPanelReviews.push(reviewData);
            } else {
              newGuideReviews.push(reviewData);
            }
          });
          
          if (newGuideReviews.length > 0) setGuideReviews(newGuideReviews);
          if (newPanelReviews.length > 0) setPanelReviews(newPanelReviews);
          
          setMessage("Existing marking schema loaded successfully!");
        } else {
          setMessage("No existing marking schema found. You can create new ones.");
        }
      }
    } catch (err) {
      console.error("Error fetching deadlines:", err);
      if (err.response?.status === 404) {
        setMessage("No existing marking schema found. You can create new ones.");
      } else {
        setMessage("Error loading existing data. You can still create a new marking schema.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Save marking schema
  const handleSaveDeadlines = async () => {
    if (!selectedSchool || !selectedDepartment) {
      setMessage("Please select both school and department.");
      return;
    }

    if (!canSave) {
      setMessage(`Total weight must be exactly 100. Current total: ${totalWeight}`);
      return;
    }

    setSaving(true);
    setMessage("");
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
          to: review.to.toISOString(),
        },
        requiresPPT: review.requiresPPT || false,
      }));

      console.log("Final reviews payload:", JSON.stringify(reviews, null, 2));

      const response = await createOrUpdateMarkingSchema({ 
        school: selectedSchool, 
        department: selectedDepartment, 
        reviews 
      });

      if (response.data?.success) {
        // Show success state on button
        setSaving(false);
        setJustSaved(true);
        
        setMessage(`Complete marking schema saved successfully for ${selectedSchool} - ${selectedDepartment}!`);
        
        // Reset success state after 2 seconds
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
      setMessage(error.response?.data?.message || "Failed to save marking schema. Please try again.");
      setSaving(false);
    }
  };

  // Render review section
  const renderReviewSection = (reviews, reviewType, addFunction, removeFunction, title, icon, sectionWeight) => {
    const disabled = !selectedSchool || !selectedDepartment;

    return (
      <div className="mb-8">
        <div className={`flex items-center justify-between mb-6 p-6 bg-gradient-to-r ${
          reviewType === 'guide' 
            ? 'from-blue-50 via-blue-25 to-indigo-50 border-blue-200' 
            : 'from-purple-50 via-purple-25 to-pink-50 border-purple-200'
        } rounded-xl border shadow-sm ${disabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              reviewType === 'guide' ? 'bg-blue-100' : 'bg-purple-100'
            }`}>
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <div className="flex items-center gap-4 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  reviewType === 'guide' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
                {shouldShowWeightTracker && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sectionWeight > 0 
                      ? reviewType === 'guide' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    {sectionWeight} marks
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={addFunction}
            disabled={disabled || !canAddReview}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl ${
              disabled || !canAddReview
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : reviewType === 'guide'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
            }`}
            title={!canAddReview ? `Cannot add more reviews. Total weight: ${totalWeight}/100` : ''}
          >
            <Plus className="h-4 w-4" />
            Add {reviewType === 'guide' ? 'Guide' : 'Panel'} Review
          </button>
        </div>

        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${disabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={review.displayName}
                    onChange={(e) => updateReview(reviewType, review.id, 'displayName', e.target.value)}
                    disabled={disabled}
                    className="text-lg font-bold text-gray-800 border-2 border-gray-200 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                    placeholder="Review Name"
                  />
                  <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={review.requiresPPT}
                      onChange={(e) => updateReview(reviewType, review.id, 'requiresPPT', e.target.checked)}
                      disabled={disabled}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium text-gray-700">PPT Required</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFunction(review.id)}
                  disabled={disabled || reviews.length <= 1}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-3 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">From Date</label>
                  <DatePicker
                    selected={review.from}
                    onChange={(date) => updateReview(reviewType, review.id, 'from', date)}
                    disabled={disabled}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">To Date</label>
                  <DatePicker
                    selected={review.to}
                    onChange={(date) => updateReview(reviewType, review.id, 'to', date)}
                    disabled={disabled}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Components
                  </label>
                  <button
                    onClick={() => addComponent(reviewType, review.id)}
                    disabled={disabled}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {review.components.map((component, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={component.name}
                        onChange={(e) => updateComponent(reviewType, review.id, index, 'name', e.target.value)}
                        disabled={disabled}
                        placeholder="Component Name"
                        className="flex-1 border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={component.weight}
                          onChange={(e) => updateComponent(reviewType, review.id, index, 'weight', e.target.value)}
                          disabled={disabled}
                          placeholder="Weight"
                          min="0"
                          max="100"
                          className="w-20 border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center font-bold"
                          style={{ 
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none'
                          }}
                        />
                        <span className="text-sm font-medium text-gray-500">marks</span>
                      </div>
                      <button
                        onClick={() => removeComponent(reviewType, review.id, index)}
                        disabled={disabled || review.components.length === 1}
                        className={`p-2 rounded-lg transition-colors ${
                          disabled || review.components.length === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                        }`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar userType="admin" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Schedule Management
              </h1>
              <p className="text-gray-600 text-lg">Configure review schedules and marking components</p>
            </div>
          </div>

          {/* School/Department Selector */}
          <div className="mb-8 p-8 bg-white border border-gray-200 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              Select School & Department
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  School <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="block w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                  required
                >
                  <option value="">Select School</option>
                  {schoolOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                  required
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conditional Weight Summary - Only show when school & department selected */}
          {shouldShowWeightTracker && (
            <div className="fixed top-6 right-6 z-50">
              <div className={`px-6 py-4 rounded-2xl shadow-2xl border-2 backdrop-blur-sm transition-all duration-300 ${
                totalWeight === 100 
                  ? 'bg-green-50/90 border-green-300 text-green-800'
                  : totalWeight > 100 
                    ? 'bg-red-50/90 border-red-300 text-red-800'
                    : 'bg-blue-50/90 border-blue-300 text-blue-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    totalWeight === 100 
                      ? 'bg-green-100' 
                      : totalWeight > 100 
                        ? 'bg-red-100' 
                        : 'bg-blue-100'
                  }`}>
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Total Weight: {totalWeight}/100</div>
                    <div className="text-sm opacity-80">
                      Guide: {guideWeight} • Panel: {panelWeight}
                    </div>
                  </div>
                </div>
                {totalWeight !== 100 && (
                  <div className="text-sm mt-2 opacity-90">
                    {totalWeight < 100 ? `Need ${100 - totalWeight} more marks` : `Exceeded by ${totalWeight - 100} marks`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-xl text-gray-600">Loading existing marking schema...</div>
            </div>
          )}

          {/* Selection Prompt */}
          {!selectedSchool || !selectedDepartment ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-lg">
              <Building2 className="h-20 w-20 mx-auto mb-6 text-gray-300" />
              <div className="text-3xl font-bold text-gray-600 mb-4">Choose School & Department</div>
              <div className="text-lg text-gray-500">Please select a school and department above to configure schedules</div>
            </div>
          ) : (
            <>
              {/* Messages */}
              {message && (
                <div className={`p-6 rounded-2xl mb-8 border shadow-lg ${
                  message.includes('successfully') 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : message.includes('Error') || message.includes('Failed') || message.includes('Cannot') || message.includes('exceed') || message.includes('negative')
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  <div className="flex items-center">
                    {message.includes('successfully') ? (
                      <CheckCircle className="h-6 w-6 mr-4 flex-shrink-0 text-green-600" />
                    ) : message.includes('Error') || message.includes('Failed') || message.includes('Cannot') || message.includes('exceed') || message.includes('negative') ? (
                      <AlertCircle className="h-6 w-6 mr-4 flex-shrink-0 text-red-600" />
                    ) : (
                      <CheckCircle className="h-6 w-6 mr-4 flex-shrink-0 text-blue-600" />
                    )}
                    <span className="font-semibold text-lg">{message}</span>
                  </div>
                </div>
              )}

              {/* Guide Reviews Section */}
              {renderReviewSection(
                guideReviews,
                'guide',
                addGuideReview,
                removeGuideReview,
                'Guide Reviews',
                <GraduationCap className="h-6 w-6 text-blue-600" />,
                guideWeight
              )}

              {/* Panel Reviews Section */}
              {renderReviewSection(
                panelReviews,
                'panel',
                addPanelReview,
                removePanelReview,
                'Panel Reviews',
                <Users className="h-6 w-6 text-purple-600" />,
                panelWeight
              )}

              {/* Save Button with Success State */}
              <div className="flex justify-center">
                <button
                  onClick={handleSaveDeadlines}
                  disabled={saving || loading || !canSave || justSaved}
                  className={`px-12 py-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-3xl ${
                    justSaved
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white transform scale-105'
                      : canSave && !saving && !loading
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                  title={!canSave ? `Total weight must be exactly 100. Current: ${totalWeight}` : ''}
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-4"></div>
                      Saving Schema...
                    </div>
                  ) : justSaved ? (
                    <div className="flex items-center">
                      <CheckCircle className="h-6 w-6 mr-4 animate-pulse" />
                      Saved Successfully!
                    </div>
                  ) : (
                    `Save Complete Schema (${totalWeight}/100)`
                  )}
                </button>
              </div>

              {/* Enhanced Weight Distribution Info */}
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  Weight Distribution Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Total Weight:</strong> Must equal exactly 100 marks across all components</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Weight Limits:</strong> Individual component weights must be between 0-100</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Components:</strong> Each review must have at least one component with a name</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Review Limits:</strong> Cannot add new reviews if total weight reaches/exceeds 100</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>PPT Required:</strong> Enable PPT approval section for specific reviews</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div><strong>Faculty Types:</strong> Reviews are mapped to either 'guide' or 'panel' faculty</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Schedule;
