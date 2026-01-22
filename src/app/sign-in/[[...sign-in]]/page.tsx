import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-neutral-800 border border-neutral-700',
            headerTitle: 'text-neutral-100',
            headerSubtitle: 'text-neutral-400',
            socialButtonsBlockButton: 'bg-neutral-700 border-neutral-600 text-neutral-100 hover:bg-neutral-600',
            socialButtonsBlockButtonText: 'text-neutral-100',
            dividerLine: 'bg-neutral-600',
            dividerText: 'text-neutral-400',
            formFieldLabel: 'text-neutral-300',
            formFieldInput: 'bg-neutral-700 border-neutral-600 text-neutral-100',
            formButtonPrimary: 'bg-primary-500 hover:bg-primary-600',
            footerActionLink: 'text-primary-400 hover:text-primary-300',
            identityPreviewText: 'text-neutral-100',
            identityPreviewEditButton: 'text-primary-400',
          },
        }}
      />
    </div>
  );
}
