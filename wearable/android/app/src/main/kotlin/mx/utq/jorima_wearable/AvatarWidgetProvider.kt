package mx.utq.jorima_wearable

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * Widget del avatar de Jorima (entregable del segundo parcial).
 *
 * Es un App Widget clásico: el reloj lo muestra en su pantalla de widgets y al
 * tocarlo abre la aplicación.
 *
 * El `PendingIntent` se construye con `FLAG_IMMUTABLE`, exactamente como en la
 * Práctica 4 (TaskAlert): desde Android 12 es obligatorio declarar la
 * mutabilidad de una intención pendiente, y una que sólo abre la app nunca debe
 * ser mutable.
 *
 * Nota de alcance: en Wear OS 3+ los widgets aparecen en la pantalla de
 * widgets del reloj. Una versión más "de reloj" para el futuro sería un Tile
 * con `androidx.wear.tiles`, que se fija a un lado de la esfera; este widget
 * cumple el criterio acordado ("aparece en el reloj y abre la app") sin añadir
 * dependencias extra.
 */
class AvatarWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            val vistas = RemoteViews(context.packageName, R.layout.avatar_widget)
            vistas.setOnClickPendingIntent(R.id.widget_avatar_raiz, abrirApp(context))
            appWidgetManager.updateAppWidget(appWidgetId, vistas)
        }
    }

    /** Intención que abre Jorima al tocar el widget. */
    private fun abrirApp(context: Context): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
