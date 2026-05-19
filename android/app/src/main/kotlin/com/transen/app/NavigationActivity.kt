package com.transen.app

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.RelativeLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.mapbox.api.directions.v5.models.RouteOptions
import com.mapbox.geojson.LineString
import com.mapbox.geojson.Point
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.plugin.PuckBearing
import com.mapbox.maps.plugin.annotation.annotations
import com.mapbox.maps.plugin.annotation.generated.createPolylineAnnotationManager
import com.mapbox.maps.plugin.annotation.generated.PolylineAnnotationOptions
import com.mapbox.maps.plugin.annotation.generated.PolylineAnnotationManager
import com.mapbox.maps.plugin.locationcomponent.createDefault2DPuck
import com.mapbox.maps.plugin.locationcomponent.location
import com.mapbox.maps.plugin.viewport.viewport
import com.mapbox.navigation.base.extensions.applyDefaultNavigationOptions
import com.mapbox.navigation.base.route.NavigationRoute
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.navigation.base.route.RouterFailure
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.lifecycle.MapboxNavigationApp
import com.mapbox.navigation.base.trip.model.RouteProgress
import com.mapbox.navigation.core.trip.session.RouteProgressObserver
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class NavigationActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var mapView: MapView
    
    // UI Elements
    private lateinit var tvManeuverDistance: TextView
    private lateinit var tvManeuverText: TextView
    private lateinit var tvManeuverIcon: TextView

    private lateinit var tvTimeRemaining: TextView
    private lateinit var tvDistanceRemaining: TextView
    private lateinit var tvETA: TextView
    private lateinit var btnEndNavigation: Button

    // Polyline Drawing Manager
    private var polylineAnnotationManager: PolylineAnnotationManager? = null
    
    // Native Android TextToSpeech engine
    private var tts: TextToSpeech? = null

    // Observers
    private val routeProgressObserver = RouteProgressObserver { routeProgress ->
        // 1. Mettre à jour l'UI des maneuvers (instructions de guidage)
        val bannerInstructions = routeProgress.bannerInstructions
        val upcomingManeuver = bannerInstructions?.primary()
        if (upcomingManeuver != null) {
            tvManeuverText.text = upcomingManeuver.text()
            
            // Choisir un symbole d'icône basé sur le modificateur de direction
            val modifier = upcomingManeuver.modifier()?.lowercase(Locale.getDefault()) ?: ""
            tvManeuverIcon.text = when {
                modifier.contains("left") -> "⬅"
                modifier.contains("right") -> "➡"
                modifier.contains("slight left") -> "↖"
                modifier.contains("slight right") -> "↗"
                else -> "⬆"
            }
        }

        val distanceKm = routeProgress.distanceRemaining / 1000.0
        tvManeuverDistance.text = if (distanceKm < 1.0) {
            "${(routeProgress.distanceRemaining).toInt()} m"
        } else {
            String.format(Locale.getDefault(), "%.1f km", distanceKm)
        }

        // 2. Mettre à jour la durée et distance restantes (Footer)
        val minutesRemaining = (routeProgress.durationRemaining / 60.0).toInt()
        tvTimeRemaining.text = if (minutesRemaining >= 60) {
            val hours = minutesRemaining / 60
            val mins = minutesRemaining % 60
            "${hours} h ${mins} min"
        } else {
            "${minutesRemaining} min"
        }

        tvDistanceRemaining.text = String.format(Locale.getDefault(), "%.1f km restante(s)", distanceKm)

        // Calculer l'ETA
        val etaCalendar = Calendar.getInstance()
        etaCalendar.add(Calendar.SECOND, routeProgress.durationRemaining.toInt())
        val etaFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        tvETA.text = "Arrivée ${etaFormat.format(etaCalendar.time)}"
    }

    private val voiceInstructionsObserver = com.mapbox.navigation.core.trip.session.VoiceInstructionsObserver { voiceInstructions ->
        // Utiliser TTS natif Android en français pour lire les instructions vocales
        val announcement = voiceInstructions.announcement()
        if (!announcement.isNullOrEmpty()) {
            try {
                tts?.speak(announcement, TextToSpeech.QUEUE_FLUSH, null, null)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.FRENCH
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Initialiser MapboxNavigationApp si ce n'est pas déjà fait
        try {
            val navigationOptions = com.mapbox.navigation.base.options.NavigationOptions.Builder(this)
                .build()
            MapboxNavigationApp.setup(navigationOptions)
        } catch (e: Exception) {
            // Déjà configuré
        }
        MapboxNavigationApp.attach(this)

        // 2. Initialiser l'interface utilisateur
        setupLayout()

        // 3. Initialiser TTS
        tts = TextToSpeech(this, this)

        // 4. Récupérer les coordonnées passées par le bridge Flutter
        val originLat = intent.getDoubleExtra("originLat", 0.0)
        val originLng = intent.getDoubleExtra("originLng", 0.0)
        val destLat = intent.getDoubleExtra("destLat", 0.0)
        val destLng = intent.getDoubleExtra("destLng", 0.0)

        // 5. Charger le style de carte et lancer la navigation
        mapView.mapboxMap.loadStyle(Style.MAPBOX_STREETS) {
            try {
                // Activer le Puck (indicateur de position)
                mapView.location.apply {
                    enabled = true
                    locationPuck = createDefault2DPuck(withBearing = true)
                    puckBearingEnabled = true
                    puckBearing = PuckBearing.COURSE
                }
                
                // Suivre le Puck avec la caméra
                mapView.viewport.transitionTo(
                    targetState = mapView.viewport.makeFollowPuckViewportState(),
                    transition = mapView.viewport.makeImmediateViewportTransition()
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Calculer et lancer l'itinéraire
            requestTripRoute(originLat, originLng, destLat, destLng)
        }
    }

    private fun setupLayout() {
        val rootLayout = RelativeLayout(this)
        rootLayout.layoutParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.MATCH_PARENT
        )

        // Map View
        mapView = MapView(this)
        mapView.layoutParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.MATCH_PARENT
        )
        rootLayout.addView(mapView)

        // Header Panel (Guidage)
        val headerCard = CardView(this)
        val headerParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            addRule(RelativeLayout.ALIGN_PARENT_TOP)
            setMargins(32, 48, 32, 0)
        }
        headerCard.layoutParams = headerParams
        headerCard.radius = 24f
        headerCard.cardElevation = 16f
        headerCard.setCardBackgroundColor(Color.parseColor("#E61E1E24")) // Dark Translucent

        val headerContent = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setPadding(32, 32, 32, 32)
            gravity = Gravity.CENTER_VERTICAL
        }

        // Maneuver Icon
        tvManeuverIcon = TextView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = 24
            }
            textSize = 36f
            setTextColor(Color.parseColor("#4CC9F0")) // Cyan électrique
            text = "⬆"
            gravity = Gravity.CENTER
        }
        headerContent.addView(tvManeuverIcon)

        // Instruction Text (Vertical)
        val textLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        tvManeuverDistance = TextView(this).apply {
            textSize = 24f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            text = "Calcul du trajet..."
        }
        textLayout.addView(tvManeuverDistance)

        tvManeuverText = TextView(this).apply {
            textSize = 15f
            setTextColor(Color.parseColor("#A0A0A5"))
            text = "Veuillez patienter pendant la configuration..."
        }
        textLayout.addView(tvManeuverText)

        headerContent.addView(textLayout)
        headerCard.addView(headerContent)
        rootLayout.addView(headerCard)

        // Footer Panel (Progress)
        val footerCard = CardView(this)
        val footerParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            addRule(RelativeLayout.ALIGN_PARENT_BOTTOM)
            setMargins(32, 0, 32, 48)
        }
        footerCard.layoutParams = footerParams
        footerCard.radius = 28f
        footerCard.cardElevation = 16f
        footerCard.setCardBackgroundColor(Color.parseColor("#F51E1E24")) // Dark solide

        val footerContent = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setPadding(32, 32, 32, 32)
        }

        // Progress Text Layout (Horizontal)
        val progressInfoLayout = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        tvTimeRemaining = TextView(this).apply {
            textSize = 22f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#4CC9F0")) // Cyan
            text = "-- min"
            gravity = Gravity.CENTER
        }
        progressInfoLayout.addView(tvTimeRemaining)

        val separator = TextView(this).apply {
            textSize = 18f
            setTextColor(Color.parseColor("#505055"))
            text = "  •  "
        }
        progressInfoLayout.addView(separator)

        tvDistanceRemaining = TextView(this).apply {
            textSize = 16f
            setTextColor(Color.WHITE)
            text = "-- km"
            gravity = Gravity.CENTER
        }
        progressInfoLayout.addView(tvDistanceRemaining)

        val separator2 = TextView(this).apply {
            textSize = 18f
            setTextColor(Color.parseColor("#505055"))
            text = "  •  "
        }
        progressInfoLayout.addView(separator2)

        tvETA = TextView(this).apply {
            textSize = 16f
            setTextColor(Color.parseColor("#A0A0A5"))
            text = "Arrivée --:--"
            gravity = Gravity.CENTER
        }
        progressInfoLayout.addView(tvETA)

        footerContent.addView(progressInfoLayout)

        // End Navigation Button
        btnEndNavigation = Button(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                110 // height
            )
            setBackgroundColor(Color.parseColor("#E63946")) // Rouge
            setTextColor(Color.WHITE)
            text = "Terminer le trajet"
            setTypeface(null, Typeface.BOLD)
            textSize = 15f
            setOnClickListener {
                finish()
            }
        }
        footerContent.addView(btnEndNavigation)

        footerCard.addView(footerContent)
        rootLayout.addView(footerCard)

        setContentView(rootLayout)
    }

    private fun drawRouteLine(route: NavigationRoute) {
        val geometry = route.directionsRoute.geometry()
        if (!geometry.isNullOrEmpty()) {
            try {
                val lineString = LineString.fromPolyline(geometry, 6)
                val points = lineString.coordinates()

                if (polylineAnnotationManager == null) {
                    polylineAnnotationManager = mapView.annotations.createPolylineAnnotationManager()
                } else {
                    polylineAnnotationManager?.deleteAll()
                }

                val polylineOptions = PolylineAnnotationOptions()
                    .withPoints(points)
                    .withLineColor("#4CC9F0")
                    .withLineWidth(6.0)
                polylineAnnotationManager?.create(polylineOptions)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun requestTripRoute(originLat: Double, originLng: Double, destLat: Double, destLng: Double) {
        val mapboxNavigation = MapboxNavigationApp.current()
        if (mapboxNavigation == null) {
            Toast.makeText(this, "Erreur d'initialisation du GPS", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        val originPoint = Point.fromLngLat(originLng, originLat)
        val destPoint = Point.fromLngLat(destLng, destLat)

        val routeOptions = RouteOptions.builder()
            .applyDefaultNavigationOptions()
            .coordinatesList(listOf(originPoint, destPoint))
            .build()

        mapboxNavigation.requestRoutes(routeOptions, object : NavigationRouterCallback {
            override fun onRoutesReady(routes: List<NavigationRoute>, routerOrigin: String) {
                if (routes.isNotEmpty()) {
                    mapboxNavigation.setNavigationRoutes(routes)
                    
                    // Commencer le guidage GPS actif et la session de trajet
                    mapboxNavigation.startTripSession()
                    
                    // Tracer la ligne sur la carte
                    drawRouteLine(routes[0])
                } else {
                    Toast.makeText(this@NavigationActivity, "Aucun itinéraire trouvé", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(reasons: List<RouterFailure>, routeOptions: RouteOptions) {
                Toast.makeText(this@NavigationActivity, "Impossible de calculer l'itinéraire", Toast.LENGTH_SHORT).show()
            }

            override fun onCanceled(routeOptions: RouteOptions, routerOrigin: String) {}
        })
    }

    override fun onStart() {
        super.onStart()
        val mapboxNavigation = MapboxNavigationApp.current()
        if (mapboxNavigation != null) {
            mapboxNavigation.registerRouteProgressObserver(routeProgressObserver)
            mapboxNavigation.registerVoiceInstructionsObserver(voiceInstructionsObserver)
        }
    }

    override fun onStop() {
        super.onStop()
        val mapboxNavigation = MapboxNavigationApp.current()
        if (mapboxNavigation != null) {
            mapboxNavigation.unregisterRouteProgressObserver(routeProgressObserver)
            mapboxNavigation.unregisterVoiceInstructionsObserver(voiceInstructionsObserver)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
