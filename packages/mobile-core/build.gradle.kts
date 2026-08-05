/**
 * mobile-core — LKVIP Shared Android Library
 *
 * Gradle module cung cấp các class dùng chung cho:
 *   - apps/mobile-native       (Staff / Operations app)
 *   - apps/mobile-native-enterprise (C-Level Enterprise app)
 *
 * Để sử dụng trong app module:
 *   include(":mobile-core") trong settings.gradle.kts
 *   implementation(project(":mobile-core")) trong build.gradle.kts
 */

plugins {
    id("com.android.library") version "8.4.0"
    id("org.jetbrains.kotlin.android") version "2.0.0"
}

android {
    namespace = "com.lkvip.mobilecore"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // ── Networking ────────────────────────────────────────────────────────────
    api("com.squareup.retrofit2:retrofit:2.12.0")
    api("com.squareup.retrofit2:converter-gson:2.12.0")
    api("com.squareup.okhttp3:okhttp:4.12.0")
    api("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // ── Coroutines ────────────────────────────────────────────────────────────
    api("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    api("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")

    // ── Android core ─────────────────────────────────────────────────────────
    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.appcompat:appcompat:1.7.0")

    // ── Testing ───────────────────────────────────────────────────────────────
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
}
