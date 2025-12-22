import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { Schema } from 'effect';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const registerSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Name is required' })
  ),
  email: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Email is required' }),
    Schema.filter((email) => /\S+@\S+\.\S+/.test(email), {
      message: () => 'Please enter a valid email address',
    })
  ),
  password: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => 'Password must be at least 8 characters long',
    })
  ),
  confirmPassword: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Please confirm your password' })
  ),
}).pipe(
  Schema.filter((data) => data.password === data.confirmPassword, {
    message: () => 'Passwords do not match',
  })
);

type RegisterFormValues = typeof registerSchema.Type;

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const lastMethod = authClient.getLastUsedLoginMethod();

  const form = useForm<RegisterFormValues>({
    resolver: effectTsResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error) {
        setError(result.error.message || 'Registration failed');
      } else {
        setSuccess(
          'Account created successfully! Please check your email to verify your account.'
        );
        form.reset();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/teams',
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Google sign up failed'
      );
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-bold text-2xl">Create your account</h1>
        <p className="text-balance text-muted-foreground text-sm">
          Enter your details below to create your account
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-800 text-sm">
          {success}
        </div>
      )}

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="m@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Create a password"
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Confirm your password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className="w-full"
            disabled={isLoading}
            type="submit"
            variant={lastMethod === 'email' ? 'default' : 'outline'}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? 'Creating Account...' : 'Create Account with Email'}
              {lastMethod === 'email' && (
                <Badge className="ml-2" variant="secondary">
                  Last used
                </Badge>
              )}
            </span>
          </Button>
        </form>
      </Form>

      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">
          Or continue with
        </span>
      </div>

      <Button
        className="w-full"
        onClick={handleGoogleSignUp}
        type="button"
        variant={lastMethod === 'google' ? 'default' : 'outline'}
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <title>Google</title>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
          {lastMethod === 'google' && (
            <Badge className="ml-2" variant="secondary">
              Last used
            </Badge>
          )}
        </div>
      </Button>

      <div className="text-center text-sm">
        Already have an account?{' '}
        <a className="underline underline-offset-4" href="/login">
          Sign in
        </a>
      </div>
    </div>
  );
}
