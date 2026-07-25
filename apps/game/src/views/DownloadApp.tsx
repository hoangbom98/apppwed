/**
 * DownloadPage — Game sub-project
 * --------------------------------
 * Uses AppDistributionPage from shared-ui.
 * Props: { iosUrl?, androidUrl?, apkUrl?, appName?, config? }
 *
 * Route:  /download  (public, no Layout shell)
 */
import { AppDistributionPage } from '@ui';

export default function DownloadPage() {
  return (
    <AppDistributionPage
      appName="GAMEX"
      androidUrl="https://play.google.com/store/apps/details?id=com.lkvip.gamex"
      apkUrl={
        (import.meta as any).env?.VITE_DOWNLOAD_GAMEX_APK
        || 'https://yourdomain.com/downloads/gamex.apk'
      }
      iosUrl={
        (import.meta as any).env?.VITE_DOWNLOAD_GAMEX_IOS
        || 'itms-services://?action=download-manifest&url=https://yourdomain.com/ios/gamex.plist'
      }
      config={{
        primaryColor:   '#194C38',
        secondaryColor: '#2d9e6b',
        logo:           '/logo.svg',
        siteName:       'GAMEX',
        maintenance:    false,
      }}
    />
  );
}
