import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/constants/constant";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "@/redux/authSlice";
import { Loader2, Code, Github, BookOpen, Terminal, GitBranch, GitCommit } from "lucide-react";
import Eye from "../ui/Eye";

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const dispatch = useDispatch();
  const { loading } = useSelector((store) => store.auth);
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // Mouse follower refs
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);
  const [isOverForm, setIsOverForm] = useState(false);
  
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get("/class/classes");
        setClasses(response.data.classes);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to fetch classes. Please try again.");
      }
    };

    fetchClasses();
    
    // Mouse follower effect
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    
    if (cursor && cursorDot) {
      document.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;
        
        cursor.style.left = `${posX}px`;
        cursor.style.top = `${posY}px`;
        
        // Add a slight delay to the dot for a trailing effect
        setTimeout(() => {
          cursorDot.style.left = `${posX}px`;
          cursorDot.style.top = `${posY}px`;
        }, 100);
      });
    }
    
    return () => {
      document.removeEventListener('mousemove', () => {});
    };
  }, []);

  const onSubmit = async (data) => {
    try {
      dispatch(setLoading(true));
      const formData = {
        ...data,
        role,
        classId: selectedClass,
      };

      const res = await api.post("/user/register", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        navigate("/");
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error(
        "An error occurred:",
        error.response?.data || error.message
      );
      if (error.response?.data?.message.includes('roll number')) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleFormMouseEnter = () => {
    setIsOverForm(true);
  };

  const handleFormMouseLeave = () => {
    setIsOverForm(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden relative">
      {/* Custom cursor */}
      <div 
        ref={cursorRef} 
        className={`fixed w-16 h-16 rounded-full bg-indigo-400 filter blur-xl pointer-events-none z-50 transition-opacity duration-300 ${isOverForm ? 'opacity-0' : 'opacity-20'}`}
        style={{ transform: 'translate(-50%, -50%)' }}
      ></div>
      <div 
        ref={cursorDotRef} 
        className={`fixed w-4 h-4 rounded-full bg-indigo-600 pointer-events-none z-50 transition-opacity duration-300 ${isOverForm ? 'opacity-0' : 'opacity-100'}`}
        style={{ transform: 'translate(-50%, -50%)' }}
      ></div>
      
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div 
          className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200"
          onMouseEnter={handleFormMouseEnter}
          onMouseLeave={handleFormMouseLeave}
        >
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <Code className="h-10 w-10 text-indigo-600" />
                <h1 className="text-4xl font-bold text-gray-800 ml-2">ScriptSaga</h1>
              </div>
              <p className="text-gray-600">Your Coding Journey Begins Here</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                  <Input
                    type="text"
                    placeholder="John"
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                    className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                  <Input
                    type="text"
                    placeholder="Doe"
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                    className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  {...register("email", { required: "Email is required" })}
                  className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    type={passwordVisible ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                    })}
                    className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600 pr-10"
                  />
                  <Eye
                    isVisible={passwordVisible}
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="githubID" className="text-gray-700 flex items-center gap-1">
                    <Github className="h-4 w-4 text-gray-500" /> GitHub Username
                  </Label>
                  <Input
                    type="text"
                    placeholder="johndoe"
                    {...register("githubID", {
                      required: "GitHub ID is required",
                    })}
                    className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                  />
                  {errors.githubID && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.githubID.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="leetCodeID" className="text-gray-700 flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-gray-500" /> LeetCode Username
                  </Label>
                  <Input
                    type="text"
                    placeholder="johndoe"
                    {...register("leetCodeID", {
                      required: "LeetCode ID is required",
                    })}
                    className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                  />
                  {errors.leetCodeID && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.leetCodeID.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Class and Roll No in one row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classId" className="text-gray-700">Class</Label>
                  <Select
                    onValueChange={(value) => setSelectedClass(value)}
                    className="mt-1"
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-800 focus:ring-indigo-600">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-800 border-gray-300">
                      {classes.map((cls) => (
                        <SelectItem key={cls._id} value={cls._id} className="focus:bg-indigo-50 focus:text-indigo-700">
                          {cls.className} ({cls.yearOfStudy} - {cls.branch} - {cls.division})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.classId && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.classId.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="rollNo" className="text-gray-700">Roll No</Label>
                  <Input
                    type="text"
                    placeholder="Enter your roll number"
                    {...register("rollNo", { required: "Roll No is required" })}
                    className="mt-1 bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-indigo-600"
                  />
                  {errors.rollNo && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.rollNo.message}
                    </p>
                  )}
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 transform hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Decorative content */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-6 z-10">
        <div className="max-w-md">
          <div className="mb-8">
            <h2 className="text-5xl font-bold mb-4 text-gray-800">
              Join the <span className="text-indigo-600">ScriptSaga</span> community
            </h2>
            <p className="text-lg text-gray-600">
              Track your coding progress, collaborate with peers, and build your developer portfolio.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4 bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-600 transition-all duration-300 transform hover:scale-[1.02] shadow-sm">
              <div className="bg-indigo-100 p-3 rounded-full">
                <GitCommit className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Track Your Commits</h3>
                <p className="text-gray-600">Monitor your GitHub activity and see your progress over time.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-600 transition-all duration-300 transform hover:scale-[1.02] shadow-sm">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Terminal className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Coding Analytics</h3>
                <p className="text-gray-600">Get insights into your programming languages and coding patterns.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-600 transition-all duration-300 transform hover:scale-[1.02] shadow-sm">
              <div className="bg-indigo-100 p-3 rounded-full">
                <GitBranch className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Career Roadmap</h3>
                <p className="text-gray-600">Get personalized career guidance based on your coding activities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
