package org.asafonov.app;

import android.content.Intent;
import android.net.Uri;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.widget.EditText;
import android.text.InputType;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.JsResult;
import android.webkit.JsPromptResult;

class MyWebChromeClient extends WebChromeClient {

    @Override
    public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
        new AlertDialog.Builder(view.getContext())
            .setTitle("asafonov.org")
            .setMessage(message)
            .setPositiveButton("OK",
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        result.confirm();
                    }
                }
            )
            .setOnDismissListener(
                new DialogInterface.OnDismissListener() {
                    @Override
                    public void onDismiss(DialogInterface dialog) {
                        result.confirm();
                    }
                }
            )
            .create()
            .show();
        return true;
    }

    @Override
    public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
        new AlertDialog.Builder(view.getContext())
            .setTitle("asafonov.org")
            .setMessage(message)
            .setPositiveButton("OK",
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        result.confirm();
                    }
                }
            )
            .setNegativeButton("Cancel",
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        result.cancel();
                    }
                }
            )
            .setOnDismissListener(
                new DialogInterface.OnDismissListener() {
                    @Override
                    public void onDismiss(DialogInterface dialog) {
                        result.cancel();
                    }
                }
            )
            .create()
            .show();
        return true;
    }

    @Override
    public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, final JsPromptResult result) {
        final EditText input = new EditText(view.getContext());
        input.setInputType(InputType.TYPE_CLASS_TEXT);
        input.setText(defaultValue);
        new AlertDialog.Builder(view.getContext())
            .setTitle("asafonov.org")
            .setMessage(message)
            .setView(input)
            .setPositiveButton("OK",
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        result.confirm(input.getText().toString());
                    }
                }
            )
            .setNegativeButton("Cancel",
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        result.cancel();
                    }
                }
            )
            .setOnDismissListener(
                new DialogInterface.OnDismissListener() {
                    @Override
                    public void onDismiss(DialogInterface dialog) {
                        result.cancel();
                    }
                }
            )
            .create()
            .show();
        return true;
    }

}
