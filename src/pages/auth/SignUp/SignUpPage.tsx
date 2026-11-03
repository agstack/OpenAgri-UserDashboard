import { Box, Button, IconButton, InputAdornment, Link, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import logo from "/logo-color.png";
import { useNavigate } from "react-router-dom";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";

const SignUpPage = () => {
    const [credentials, setCredentials] = useState({ username: "", email: "", password: "", confirm_password: "", firstName: "", lastName: "" });
    const [errors, setErrors] = useState({ username: "", email: "", password: "", confirm_password: "" });
    const [showPassword, setShowPassword] = useState(false);

    const validateUsername = (username: string) => {
        if (!username) return "Username is required";
        return "";
    };

    const validateEmail = (email: string) => {
        if (!email) return "Email is required";
        if (!/^\S+@\S+\.\S+$/.test(email)) return "Invalid email format";
        return "";
    };

    const validatePassword = (password: string) => {
        if (!password) return "Password is required";
        if (password.length < 8) return "Password must be at least 8 characters";
        return "";
    };

    const validateConfirmPassword = (confirmPassword: string) => {
        if (!confirmPassword) return "Confirm password is required";
        if (confirmPassword !== credentials.password) return "Passwords do not match";
        return "";
    };

    const validateField = (name: string, value: string) => {
        let error = "";
        if (name === "username") error = validateUsername(value);
        if (name === "email") error = validateEmail(value);
        if (name === "password") error = validatePassword(value);
        if (name === "confirm_password") error = validateConfirmPassword(value);
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const { fetchData, loading, response, error } = useFetch<{ success: boolean; message: string }>(
        "register/",
        {
            method: "POST",
            body: {
                username: credentials.username,
                email: credentials.email,
                password: credentials.password,
                confirm_password: credentials.confirm_password,
                ...(credentials.firstName && { first_name: credentials.firstName }),
                ...(credentials.lastName && { last_name: credentials.lastName }),
            },
        }
    );

    const handleSubmit = async () => {
        const usernameError = validateUsername(credentials.username);
        const emailError = validateEmail(credentials.email);
        const passwordError = validatePassword(credentials.password);
        const confirmPasswordError = validateConfirmPassword(credentials.confirm_password);

        setErrors({ username: usernameError, email: emailError, password: passwordError, confirm_password: confirmPasswordError });

        if (usernameError || emailError || passwordError || confirmPasswordError) return;

        await fetchData();
    };

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        if (response) {
            showSnackbar("success", response.message ?? "Registration successful. Please log in.");
            setTimeout(() => navigate("/sign-in"), 1000);
        }
    }, [response]);

    useEffect(() => {
        if (error) {
            showSnackbar("error", error?.message.toString() ?? "Registration failed");
        }
    }, [error]);

    return (
        <>
            <Box display="flex" justifyContent="center">
                <Box alignItems="center" justifyContent="center" display="flex" flex={1} maxWidth={500} flexDirection="column" gap={2}>
                    <img src={logo} alt="" width="200px" />
                    <Typography variant="h6">Sign Up</Typography>
                    <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={credentials.username}
                        onChange={handleChange}
                        error={!!errors.username}
                        helperText={errors.username}
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={credentials.firstName}
                        onChange={handleChange}
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={credentials.lastName}
                        onChange={handleChange}
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={credentials.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        variant="outlined"
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={handleChange}
                        error={!!errors.password}
                        helperText={errors.password}
                        variant="outlined"
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword((show) => !show)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Confirm Password"
                        name="confirm_password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.confirm_password}
                        onChange={handleChange}
                        error={!!errors.confirm_password}
                        helperText={errors.confirm_password}
                        variant="outlined"
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword((show) => !show)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />
                    <Button
                        fullWidth
                        startIcon={<PersonAddIcon />}
                        disabled={loading}
                        onClick={handleSubmit}
                        variant="contained"
                    >
                        Sign Up
                    </Button>
                    <Box display="flex">
                        <Link textAlign="center" href="/sign-in" underline="none">
                            {"Already have an account? Sign in"}
                        </Link>
                    </Box>
                </Box>
            </Box>
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    )
}

export default SignUpPage;