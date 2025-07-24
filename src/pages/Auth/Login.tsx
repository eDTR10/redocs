import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
// import Slider from "react-slick"
// import "slick-carousel/slick/slick.css"
// import "slick-carousel/slick/slick-theme.css"
import axios from "./../../plugin/axios"
import Swal from 'sweetalert2'
import { useNavigate } from "react-router-dom"
import './button.css'

import R10bg from './../../assets/r10-bg.jpg'
import eDoc from './../../assets/eDocs-Logo.png'
function Login() {

  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState({
    email: "",
    password: ""
  })


  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">

      <div className="flex h-screen items-center justify-center bg-background flex-col">
        <img src={R10bg} className=" opacity-10 w-screen h-screen object-cover absolute z-0 " alt="" />
        <p className=" text-xs fixed z-20 bottom-0 mb-10">Developed by: DICT Region 10
        </p>


        <div className=" z-10 w-[30vw] sm:w-[90%] bg-background border rounded-sm border-border  lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-5">

          <div className="w-full max-w-md ">
            <div className=" fixed top-0 right-0 p-4">
              <ModeToggle />
            </div>





            <div className="flex mb-3 justify-between items-center gap-2 text-center">

              <h1 className="text-4xl font-bold text-primary"> Sign In</h1>
              <img className=" h-12 object-contain" src={eDoc} alt="" />

            </div>


            <form onSubmit={(e) => {

              e.preventDefault()
              setIsLoading(true)
              // Handle login logic here

              const timeoutId = setTimeout(() => {
                setIsLoading(false)
                Swal.fire({
                  icon: 'error',
                  title: 'Request Timeout',
                  text: 'The server is taking too long to respond. Please try again.',

                })
              }, 5000)

              axios.post('token/login/', data).then((e) => {


                const token = e.data.auth_token;
                localStorage.setItem('accessToken', token);
                axios.get('users/me/', {
                  headers: {
                    Authorization: `Token ${token}`,
                  },
                }).then((response) => {
                  console.log(response.data)
                  localStorage.setItem('accessLevel', response.data.acc_lvl);
                  setIsLoading(false)
                  setData({
                    email: "", password: ""
                  })

                  if (response.data.access_level === 0 || response.data.access_level === 3) {
                    navigate('/redocs/admin')
                  } else {
                    navigate('/redocs/user')
                  }

                  Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: `Welcome back! ${response.data.first_name}`,
                    showConfirmButton: false,
                    timer: 1500,
                  })

                })


              }).catch((error) => {
                console.error('There was an error!', error)
                Swal.fire({
                  icon: 'error',
                  title: 'Login Failed',
                  text: error.response?.data?.non_field_errors?.[0] || 'Invalid credentials. Please try again.',
                  timer: 1500,
                  showConfirmButton: false,
                })
              })
                .finally(() => {
                  clearTimeout(timeoutId) // Clear the timeout if request completes
                  setIsLoading(false)
                })

              console.log("Login form submitted")

            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className=" text-secondary-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className=" text-secondary-foreground"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className=" text-secondary-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                    className=" text-secondary-foreground"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <p

                className="text-sm pt-1  text-primary self-end hover:underline text-end cursor-pointer"
              >
                Forgot password?
              </p>

              <Button
                type="submit"
                className="w-full btn-donate"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">

              {/* <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a
                  href="#"
                  className="text-primary hover:underline"
                >
                  Create account
                </a>
              </p> */}
            </div>
          </div>
        </div>


      </div>
    </ThemeProvider>
  )
}

export default Login