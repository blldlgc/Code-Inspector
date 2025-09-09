import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth";
import { DialogManager } from "@/components/DialogManager";


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await authService.login({ username: email, password });
          window.location.href = '/';
      } catch (error) {
          setError('Login failed. Please check your credentials.');
      }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!username.match(/^[a-zA-Z0-9_]{3,}$/)) {
        setError('Username must be at least 3 characters long and can only contain letters, numbers and underscore');
        return;
      }

      if (!email.match(/^[A-Za-z0-9+_.-]+@(.+)$/)) {
        setError('Invalid email format');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      await authService.register({ username, email, password });
      window.location.href = '/';
    } catch (error: any) {
        setError(error.response?.data?.message || 'Signup failed. Please try again.');
    }
};

const handleForgotPassword = async () => {
  setError('Password reset functionality is not available yet.');
};

const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
  setter(value);
  setError('');
};

    return (

        <div className="flex items-center justify-center w-screen h-screen bg-background">

            <div className="w-full max-w-[400px] p-4 flex flex-col items-center">
                <div className="mb-8">
                    <img 
                        src="/logo_full.png" 
                        alt="Code Inspector Logo" 
                        className="h-72 w-auto dark:invert rounded-lg " 
                    />
                </div>
                
                <Tabs defaultValue="login" className="w-full shadow">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Log in</TabsTrigger>
                        <TabsTrigger value="signup">Sign up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card>
                            <CardHeader>
                                <CardTitle>Log in</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogin}>
                                    <div className="mb-4">
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => handleInputChange(setEmail, e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <Input
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => handleInputChange(setPassword, e.target.value)}
                                        />
                                    </div>
                                    {error && <p className="text-red-500 text-sm mt-2 mb-2">{error}</p>}
                                    <Button className="w-full" type="submit">Log in</Button>
                                </form>
                            </CardContent>
                            <CardFooter>
                                <p className="text-sm text-center w-full">
                                    <button onClick={handleForgotPassword} className="text-blue-500">Forgot password?
                                    </button>
                                </p>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                    <TabsContent value="signup">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sign up</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSignup}>
                                    <div className="mb-4">
                                        <Input
                                            type="text"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => handleInputChange(setUsername, e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => handleInputChange(setEmail, e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <Input
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => handleInputChange(setPassword, e.target.value)}
                                        />
                                    </div>
                                    <Button className="w-full" type="submit">Sign up</Button>

                                </form>
                            </CardContent>
                            <CardFooter>
                                <p className="text-sm text-center w-full">
                                    By signing up, you agree to our Terms , Privacy Policy and Cookies Policy .
                                </p>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

        </div>

    );
};

export default LoginPage;