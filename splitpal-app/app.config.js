const appDomain = process.env.EXPO_PUBLIC_APP_DOMAIN;
const easProjectId = process.env.EAS_PROJECT_ID;

export default {
  expo: {
    name: "SplitPal",
    slug: "splitpal",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "splitpal",
    userInterfaceStyle: "automatic",
    runtimeVersion: {
      policy: "appVersion",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.splitpal.app",
      ...(appDomain ? { associatedDomains: [`applinks:${appDomain}`] } : {}),
    },
    android: {
      package: "com.splitpal.app",
      adaptiveIcon: {
        backgroundColor: "#10B981",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      intentFilters: appDomain
        ? [
            {
              action: "VIEW",
              autoVerify: true,
              data: [{ scheme: "https", host: appDomain, pathPrefix: "/join" }],
              category: ["BROWSABLE", "DEFAULT"],
            },
          ]
        : [],
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 160,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: { backgroundColor: "#0B1220" },
        },
      ],
      "expo-secure-store",
      "expo-localization",
      [
        "expo-notifications",
        {
          color: "#10B981",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appDomain,
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
  },
};
