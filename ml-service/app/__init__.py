from flask import Flask
from app.routes.pricing import pricing_bp
from app.routes.fraud import fraud_bp
from app.routes.risk import risk_bp

def create_app():
    app = Flask(__name__)
    
    # Add simple healthcheck
    @app.route('/health')
    def health():
        return {"status": "ok", "service": "ml-service"}
        
    app.register_blueprint(pricing_bp)
    app.register_blueprint(fraud_bp)
    app.register_blueprint(risk_bp)
    
    return app
