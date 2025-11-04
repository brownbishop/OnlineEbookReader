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

import {useNavigate} from "react-router-dom";

export const title = "Login Form";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .refine((val) => /[A-Z]/.test(val), "Must contain uppercase letter")
  .refine((val) => /[a-z]/.test(val), "Must contain lowercase letter")
  .refine((val) => /[0-9]/.test(val), "Must contain number")
  .refine((val) => /[!@#$%^&*]/.test(val), "Must contain special character");

const formSchema = z.object({
    username: z.string().nonempty(),
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Password must match",
    path: ["confirmPassword"],
});

function Signup() {
    const navigate = useNavigate();

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
            const res = await fetch('api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

            console.log(res);
        } catch (err) {
            console.log(err);
        }

        navigate("/login");
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm">
                <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="space-y-2 text-center">
                            <h1 className="font-bold text-2xl">Welcome</h1>
                            <p className="text-muted-foreground text-sm">
                                Enter your new account credentials
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
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({field}) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Confirm Password</FormLabel>
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
                            Sign Up
                        </Button>
                        <p className="text-center text-muted-foreground text-sm">
                            Don't have an account?{" "}
                            <a className="hover:underline" href="#">
                                Sign up
                            </a>
                        </p>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default Signup;
