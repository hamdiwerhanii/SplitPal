import { Locale } from 'src/user/enums/locale.enum';

export const OTP_EMAIL_COPY = {
  [Locale.EN]: {
    subject: '{{code}} is your SplitPal code',
    title: 'Your login code',
    intro: 'Use this code to sign in to SplitPal:',
    expires: 'It expires in {{minutes}} minutes.',
    ignore: "If you didn't ask for this code, you can ignore this email.",
  },
  [Locale.FR]: {
    subject: '{{code}} est votre code SplitPal',
    title: 'Votre code de connexion',
    intro: 'Utilisez ce code pour vous connecter à SplitPal :',
    expires: 'Il expire dans {{minutes}} minutes.',
    ignore:
      "Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail.",
  },
  [Locale.AR]: {
    subject: '{{code}} هو رمز SplitPal الخاص بك',
    title: 'رمز تسجيل الدخول',
    intro: 'استخدم هذا الرمز لتسجيل الدخول إلى SplitPal:',
    expires: 'تنتهي صلاحيته خلال {{minutes}} دقائق.',
    ignore: 'إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.',
  },
} satisfies Record<Locale, Record<string, string>>;
