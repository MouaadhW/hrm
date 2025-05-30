import React, { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { User, Briefcase, Star, Trash2 } from "lucide-react";
import { getLeaveRequestsByEmail } from "@/services/leaveService"; // adjust path
import { subMonths, format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function Dashboard() {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    joinDate: new Date(),
    role: "",
    bio: "",
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const decodedUser = jwtDecode(token);
      if (isMounted) {
        setUser(decodedUser);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setUserData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        joinDate: user.createAt ? new Date(user.createAt) : new Date(),
        role: user.role || "",
        bio: user.bio || "Experienced professional.",
      });

      // Fetch chart data
      const fetchLeaveRequests = async () => {
        try {
          const leaves = await getLeaveRequestsByEmail(user.email);

          const today = new Date();
          const monthMap = new Map();

          for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const key = format(date, "MMMM yyyy");
            monthMap.set(key, 0);
          }

          leaves.forEach((leave) => {
            const date = new Date(leave.createdAt);
            const key = format(date, "MMMM yyyy");
            if (monthMap.has(key)) {
              monthMap.set(key, (monthMap.get(key) || 0) + 1);
            }
          });

          const formatted = Array.from(monthMap.entries())
            .sort((a, b) => new Date("1 " + a[0]) - new Date("1 " + b[0]))
            .map(([month, requests]) => ({ month, requests }));

          setChartData(formatted);
        } catch (error) {
          console.error("Failed to fetch leave requests:", error);
        } finally {
          setChartLoading(false);
        }
      };

      fetchLeaveRequests();
    }
  }, [user]);

  const handleAddTodo = () => {
    if (newTodo.trim() !== "") {
      setTodos([...todos, { text: newTodo.trim(), favorite: false }]);
      setNewTodo("");
    }
  };

  const handleDeleteTodo = (index) => {
    const updatedTodos = todos.filter((_, i) => i !== index);
    setTodos(updatedTodos);
  };

  const handleToggleFavorite = (index) => {
    const updatedTodos = todos.map((todo, i) =>
      i === index ? { ...todo, favorite: !todo.favorite } : todo
    );
    setTodos(updatedTodos);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex flex-col flex-1 p-6 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back, {userData.firstName}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome to the HRM portal. Here's what's happening in the company.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Role Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Your Role</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.role || "N/A"}</div>
              <p className="text-xs text-muted-foreground">Active status</p>
            </CardContent>
          </Card>

          {/* Joined Details Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Joined</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userData.joinDate instanceof Date && !isNaN(userData.joinDate)
                  ? userData.joinDate.toLocaleDateString()
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Phone: {userData.phone || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* New Section: TODO + Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Todo List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Todo List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Todo */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Add new todo..."
                  className="flex-1 border rounded-md p-2 text-sm"
                />
                <button
                  onClick={handleAddTodo}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>

              {/* Todo List */}
              <ul className="space-y-2">
                {todos.length > 0 ? (
                  todos.map((todo, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-muted p-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFavorite(index)}
                          className="text-yellow-500"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              todo.favorite ? "fill-yellow-400" : ""
                            }`}
                          />
                        </button>
                        <span
                          className={`text-sm ${
                            todo.favorite ? "font-semibold text-yellow-600" : ""
                          }`}
                        >
                          {todo.text}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTodo(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No todos yet.</p>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Leave Request Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Leave Requests (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <p className="text-sm text-muted-foreground">Loading chart...</p>
              ) : chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="requests"
                        fill="hsl(224.3 76.3% 48%)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No leave requests found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
