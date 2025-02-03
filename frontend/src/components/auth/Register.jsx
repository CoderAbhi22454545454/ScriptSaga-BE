import React, { useEffect, useState } from "react";
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
import store from "@/redux/store";
import { Loader2 } from "lucide-react";
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
  }, []);

  const onSubmit = async (data) => {
    try {
      dispatch(setLoading(true));
      const formData = {
        ...data,
        role,
        classId: selectedClass,
      };

      console.log("Submitting form data:", formData);

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
      // Show specific error message for roll number conflict
      if (error.response?.data?.message.includes('roll number')) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-200 to-indigo-200">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600">ScriptSaga</h1>
            <p className="text-gray-600 mt-2">
              Your Coding Journey Begins Here
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  type="text"
                  placeholder="John"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                  className="mt-1"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  type="text"
                  placeholder="Doe"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                  className="mt-1"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                {...register("email", { required: "Email is required" })}
                className="mt-1"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  type={passwordVisible ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className="mt-1 pr-10"
                />
                <Eye
                  isVisible={passwordVisible}
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="githubID">GitHub Username</Label>
                <Input
                  type="text"
                  placeholder="johndoe"
                  {...register("githubID", {
                    required: "GitHub ID is required",
                  })}
                  className="mt-1"
                />
                {errors.githubID && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.githubID.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="leetCodeID">LeetCode Username</Label>
                <Input
                  type="text"
                  placeholder="johndoe"
                  {...register("leetCodeID", {
                    required: "LeetCode ID is required",
                  })}
                  className="mt-1"
                />
                {errors.leetCodeID && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.leetCodeID.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="classId">Class</Label>
              <Select
                onValueChange={(value) => setSelectedClass(value)}
                className="mt-1"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.className} ({cls.yearOfStudy} - {cls.branch} -{" "}
                      {cls.division})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.classId.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="rollNo">Roll No</Label>
              <Input
                type="text"
                placeholder=""
                {...register("rollNo", { required: "Roll No is required" })}
                className="mt-1"
              />
              {errors.rollNo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.rollNo.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Register"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 items-center justify-center right-bg">
        <div className="max-w-md text-white text-center bg-indigo-500 bg-opacity-75 p-8 rounded-lg shadow-lg" >
      
        </div>
      </div>
    </div>
  );
};

export default Register;
