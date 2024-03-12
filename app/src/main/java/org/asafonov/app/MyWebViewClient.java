package org.asafonov.app;

import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;

class MyWebViewClient extends WebViewClient {

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();

        if (url.substring(0, 5).equals("https")) {
          Uri webpage = Uri.parse(url);
          Intent intent = new Intent(Intent.ACTION_VIEW, webpage);
          view.getContext().startActivity(intent);
          return true;
        }

        view.loadUrl(url);
        return true;
    }
}
