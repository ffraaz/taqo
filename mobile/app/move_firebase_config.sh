set -e

echo "Copying Firebase config to app bundle"
echo $CONFIGURATION
cp $PROJECT_DIR/Firebase/$CONFIGURATION/GoogleService-Info.plist $BUILT_PRODUCTS_DIR/${PRODUCT_NAME}.app
