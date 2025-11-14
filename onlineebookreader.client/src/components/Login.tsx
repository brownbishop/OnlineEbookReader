import {Button} from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {z} from "zod";

import { useAppState } from "@/lib/store";
import {useNavigate} from "react-router-dom";

export const title = "Login Form";

const formSchema = z.object({
    username: z.string().nonempty(),
    password: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }),
});

function Login() {
    const navigate = useNavigate();
    const { token, setToken, currentUser, setCurrentUser } = useAppState();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const requestBody = JSON.stringify({
            name: values.username,
            password: values.password,
        });

        try {
            const res = await fetch('api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

            const data = await res.json();
            setToken(data.token);
            setCurrentUser(values.username);
            console.log(token);
            console.log(currentUser);
        } catch (err) {
            console.log(err);
        }

        navigate("/library");
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm">
                <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="space-y-2 text-center">
                        <h1 className="font-bold text-2xl">Welcome back</h1>
                        <p className="text-muted-foreground text-sm">
                            Enter your credentials to access your account
                        </p>
                    </div>
                    <FormField
                        control={form.control}
                        name="username"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input
                                        className="bg-background"
                                        placeholder="user1"
                                        type="string"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({field}) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Password</FormLabel>
                                    <a
                                        className="text-muted-foreground text-sm hover:underline"
                                        href="#"
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                                <FormControl>
                                    <Input
                                        className="bg-background"
                                        placeholder="Enter your password"
                                        type="password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button className="w-full" type="submit">
                        Sign In
                    </Button>
                    <p className="text-center text-muted-foreground text-sm">
                        Don't have an account?{" "}
                        <a className="hover:underline" href="/signup">
                            Sign up
                        </a>
                    </p>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default Login;
