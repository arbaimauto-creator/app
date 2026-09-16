// Emulator QA utility: capture the active accessibility tree without waiting for video to idle.
import android.app.UiAutomation;
import android.os.HandlerThread;
import android.os.Looper;
import android.graphics.Rect;
import android.view.accessibility.AccessibilityNodeInfo;

public class GreydUiDump {
  private static String escape(CharSequence value) {
    if (value == null) return "";
    return value.toString().replace("&", "&amp;").replace("\"", "&quot;")
      .replace("<", "&lt;").replace(">", "&gt;").replace("\n", "&#10;");
  }
  private static void node(AccessibilityNodeInfo info, StringBuilder xml) {
    if (info == null) return;
    Rect bounds = new Rect();
    info.getBoundsInScreen(bounds);
    xml.append("<node text=\"").append(escape(info.getText()))
      .append("\" content-desc=\"").append(escape(info.getContentDescription()))
      .append("\" bounds=\"[").append(bounds.left).append(",").append(bounds.top)
      .append("][").append(bounds.right).append(",").append(bounds.bottom).append("]\">");
    for (int i=0; i<info.getChildCount(); i++) node(info.getChild(i), xml);
    xml.append("</node>");
  }
  public static void main(String[] args) throws Exception {
    HandlerThread thread = new HandlerThread("greyd-ui-verification");
    thread.start();
    UiAutomation automation = null;
    try {
      Class<?> connectionType = Class.forName("android.app.IUiAutomationConnection");
      Object connection = Class.forName("android.app.UiAutomationConnection").getConstructor().newInstance();
      automation = (UiAutomation) UiAutomation.class.getConstructor(Looper.class, connectionType)
        .newInstance(thread.getLooper(), connection);
      UiAutomation.class.getMethod("connect").invoke(automation);
      Thread.sleep(500);
      AccessibilityNodeInfo root = automation.getRootInActiveWindow();
      if (root == null) throw new IllegalStateException("No active window");
      StringBuilder xml = new StringBuilder("<hierarchy>");
      node(root, xml);
      System.out.println(xml.append("</hierarchy>").toString());
    } finally {
      if (automation != null) UiAutomation.class.getMethod("disconnect").invoke(automation);
      thread.quitSafely();
    }
  }
}
