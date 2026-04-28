import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  templateUrl: './app-input.component.html',
  styleUrl: './app-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppInputComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<'text' | 'email' | 'password' | 'tel'>('text');
  readonly icon = input('mail');
  readonly size = input<'normal' | 'sm'>('normal');
  readonly autocomplete = input('off');
  readonly readonly = input(false);
  readonly maxLength = input<number | null>(null);
  readonly digitsOnly = input(false);
  readonly requiredFirstDigit = input<string | null>(null);

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let nextValue = target.value;

    if (this.digitsOnly()) {
      nextValue = nextValue.replace(/\D+/g, '');
    }

    const firstDigit = this.requiredFirstDigit();
    if (firstDigit && nextValue.length > 0 && nextValue[0] !== firstDigit) {
      nextValue = '';
    }

    const maxLength = this.maxLength();
    if (typeof maxLength === 'number' && maxLength > 0 && nextValue.length > maxLength) {
      nextValue = nextValue.slice(0, maxLength);
    }

    if (target.value !== nextValue) {
      target.value = nextValue;
    }

    this.value.set(nextValue);
    this.onChange(nextValue);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
