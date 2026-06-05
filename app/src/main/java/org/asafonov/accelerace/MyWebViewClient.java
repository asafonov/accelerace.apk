package org.asafonov.accelerace;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.widget.Toast;

class MyWebViewClient extends WebViewClient {

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();

        if (url.substring(0, 5).equals("https")) {
          Uri webpage = Uri.parse(url);
          Intent intent = new Intent(Intent.ACTION_VIEW, webpage);
          try {
            view.getContext().startActivity(intent);
          } catch (ActivityNotFoundException e) {
            Toast.makeText(view.getContext(), "No app found to open this link", Toast.LENGTH_SHORT).show();
          }
          return true;
        }

        view.loadUrl(url);
        return true;
    }
}
