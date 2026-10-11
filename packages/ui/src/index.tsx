import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
  }
>(function Button({ className, variant = 'primary', ...props }, ref) {
  return (
    <button ref={ref} className={cn('button', variant, className)} {...props} />
  );
});
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card', className)} {...props} />;
}
export function Badge({
  children,
  className,
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('badge', className)}>{children}</span>;
}
export function Empty({
  title = 'Nothing here yet',
  description = 'New records will appear here once you add them.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">↗</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
