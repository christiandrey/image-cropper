import * as React from "react";
import {
	Dimensions,
	StyleSheet,
	View,
	ImageStyle,
	ViewStyle,
	Animated,
	Image,
	PanResponderInstance,
	PanResponder,
	NativeTouchEvent,
	Button,
	ImageEditor,
	ImageStore,
	UIManager,
	LayoutAnimation
} from "react-native";
import interpolate from "polate-js";

const deviceWidth = Dimensions.get("window").width;
const deviceHeight = Dimensions.get("window").height;

const cropperWidth = deviceWidth * 0.75;
const cropperHeight = deviceWidth * 0.75;

const cropperPositionTop = deviceHeight / 2 - cropperHeight * 0.5;
const cropperPositionLeft = deviceWidth / 2 - cropperWidth * 0.5;

const imageWidth = 800;
const imageHeight = 600;

interface IImageCropperState {
	top: number;
	left: number;
	scale: number;
	scaleRangeValue: number;
	scaleRangeValueDelta: number;
	isScaling: boolean;
}

// -----------------------------------------------------------------
// ENABLE LAYOUTANIMATION
// -----------------------------------------------------------------
UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

export class ImageCropper extends React.PureComponent<{}, IImageCropperState> {
	/**
	 *
	 */
	constructor(props: Readonly<{}>) {
		super(props);

		this.state = {
			top: (deviceHeight - this.getInitialHeight()) / 2,
			left: (deviceWidth - this.getScaledWidth(this.getInitialHeight())) / 2,
			scale: 1,
			scaleRangeValue: 0,
			scaleRangeValueDelta: 0,
			isScaling: false
		} as IImageCropperState;
	}

	positionPanResponder: PanResponderInstance;
	scalePanResponder: PanResponderInstance;

	positionAnimatedValue: Animated.ValueXY;
	scaleAnimatedValue: Animated.Value;

	initialTouches: Array<NativeTouchEvent>;

	scaleRange: number;
	scaleValue: number;
	topValue: number;
	leftValue: number;

	scaleRangeMin: number = 0;
	scaleRangeMax: number = deviceWidth - 200;

	getImageAspectRatio = () => {
		return imageWidth / imageHeight;
	};

	getScaledWidth = (targetHeight: number) => {
		const aspectRatio = this.getImageAspectRatio();
		return aspectRatio * targetHeight;
	};

	getInitialHeight = () => {
		// return cropperWidth + 100;
		return cropperHeight;
	};

	getMultiplierDueToInitialZoom = () => {
		const scale = this.getScaleLevel();
		// return (cropperHeight + 100) / (cropperHeight);
		return 1 * scale;
	};

	calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
		let dx = Math.abs(x1 - x2);
		let dy = Math.abs(y1 - y2);
		return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	};

	calculateScale = (currentDistance: number, initialDistance: number) => {
		return (currentDistance / initialDistance) * 1.2;
	};

	regularizeSizeX = (value: number) => {
		const scale = this.getScaleLevel();
		return ((value / this.getScaledWidth(this.getInitialHeight())) * 800) / scale;
	};

	regularizeSizeY = (value: number) => {
		const scale = this.getScaleLevel();
		return ((value / this.getInitialHeight()) * 600) / scale;
	};

	regularizeScaleX = (value: number) => {
		const scale = this.getScaleLevel();
		// return value - (scale - 1) * 400;
		return value - (scale - 1) * (this.getScaledWidth(this.getInitialHeight()) / 4);
		// return value - ((scale - 1) * this.getInitialHeight()) / 4;
	};

	regularizeScaleY = (value: number) => {
		const scale = this.getScaleLevel();
		return value - (scale - 1) * (this.getInitialHeight() / 4);
		// return value - (scale - 1) * this.getScaledWidth(this.getInitialHeight() / 4);
		// return value / scale;
	};

	getRegularizedTop = (top: number) => {
		const scale = this.getScaleLevel();
		return top - (scale - 1) * this.getInitialHeight() * 0.5;
	};

	getRegularizedLeft = (left: number) => {
		const scale = this.getScaleLevel();
		return left - (scale - 1) * this.getScaledWidth(this.getInitialHeight()) * 0.5;
	};

	getCropOffset = () => {
		// GET CROPPPER COORDINATES
		const { top, left } = this.state;
		// const scale = (this.scaleAnimatedValue as any)._value;
		const scale = this.getScaleLevel();
		// const initialHeight = (deviceHeight - this.getInitialHeight()) * 0.5;
		// const initialWidth = (deviceWidth - this.getScaledWidth(this.getInitialHeight())) * 0.5;
		// const regularizedTop = this.regularizeScaleY(top);
		// const regularizedLeft = this.regularizeScaleX(left);
		// const regularizedTop = (deviceHeight - this.getInitialHeight() * scale) * 0.5;
		// const regularizedLeft = (deviceWidth - this.getScaledWidth(this.getInitialHeight()) * scale) * 0.5;
		// const regularizedTop = top * (1 / scale);
		// const regularizedLeft = left * (1 / scale);
		// const regularizedTop = initialHeight * 0.5 + (2 * initialHeight - top);
		// const regularizedLeft = initialWidth * 0.5 + (2 * initialWidth - left);
		const initialTop = (deviceHeight - this.getInitialHeight()) * 0.5;
		const initialLeft = (deviceWidth - this.getScaledWidth(this.getInitialHeight())) * 0.5;
		// const regularizedTop = top - (top - initialTop) * (scale - 1);
		const regularizedTop = this.getRegularizedTop(top);
		const regularizedLeft = this.getRegularizedLeft(left);
		const distanceX = this.calculateDistance(regularizedLeft, 0, cropperPositionLeft, 0);
		const distanceY = this.calculateDistance(0, regularizedTop, 0, cropperPositionTop);
		console.log("distance", distanceX, distanceY);

		const offset = {
			x: this.regularizeSizeX(this.calculateDistance(regularizedLeft, 0, cropperPositionLeft, 0)),
			y: this.regularizeSizeY(this.calculateDistance(0, regularizedTop, 0, cropperPositionTop)),
			width: this.regularizeSizeX(cropperWidth),
			height: this.regularizeSizeY(cropperHeight)
		};
		// const offset = {
		// 	x: deviceWidth / 2 - cropperWidth * 0.5 - left,
		// 	y: deviceHeight / 2 - cropperHeight * 0.5 - top,
		// 	width: cropperWidth,
		// 	height: cropperHeight
		// };
		console.log("device", deviceWidth, deviceHeight);
		console.log("image", regularizedLeft, regularizedTop);
		console.log("cropper", deviceWidth / 2 - cropperWidth * 0.5, deviceHeight / 2 - cropperHeight * 0.5);
		console.log("scale", scale);
		console.log(offset);

		const { x, y, width, height } = offset;

		ImageEditor.cropImage(
			"https://cdn.dribbble.com/users/94953/screenshots/3189793/cameraicons.png",
			{
				offset: { x, y },
				size: { width, height }
			},
			croppedImageUri => {
				ImageStore.getBase64ForTag(croppedImageUri, base64ImageData => console.log(base64ImageData), error => null);
			},
			error => null
		);
	};

	getScaleRangeCappedValue = (value: number) => {
		if (value <= this.scaleRangeMin) return this.scaleRangeMin + 1;
		if (value >= this.scaleRangeMax) return this.scaleRangeMax;

		return value;
	};

	// getScaleRangeOffset = () => {
	// 	const cappedValue = this.getScaleRangeCappedValue(this.state.scaleRangeValue + this.state.scaleRangeValueDelta);
	// 	return this.scaleRangeMax * (cappedValue / this.scaleRangeMax);
	// };

	componentWillMount = () => {
		this.initializePositionPanResponder();
		this.initializeScalePanResponder();
	};

	initializePositionPanResponder = () => {
		this.positionAnimatedValue = new Animated.ValueXY({
			x: (deviceWidth - this.getScaledWidth(this.getInitialHeight())) / 2,
			y: (deviceHeight - this.getInitialHeight()) / 2
		});
		// this.scaleAnimatedValue = new Animated.Value(1);
		this.positionPanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (e, g) => {
				this.positionAnimatedValue.extractOffset();
				// this.scaleAnimatedValue.flattenOffset();
				this.initialTouches = e.nativeEvent.touches;
			},
			onPanResponderMove: (e, g) => {
				const { dx, dy } = g;
				const touches = e.nativeEvent.touches;

				if (touches.length === 1) {
					this.positionAnimatedValue.setValue({ x: dx, y: dy });
					this.topValue = dy;
					this.leftValue = dx;
					return;
				}

				// // ---------------------------------------------------
				// // PINCH TO ZOOM
				// // ---------------------------------------------------

				// const distance = this.calculateDistance(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
				// let initialDistance;
				// if (this.initialTouches.length !== 2) {
				// 	initialDistance = cropperWidth;
				// } else {
				// 	initialDistance = this.calculateDistance(
				// 		this.initialTouches[0].pageX,
				// 		this.initialTouches[0].pageY,
				// 		this.initialTouches[1].pageX,
				// 		this.initialTouches[1].pageY
				// 	);
				// }
				// const scale = this.calculateScale(distance, initialDistance);
				// this.scaleValue = scale;
				// this.scaleAnimatedValue.setValue(scale);
			},
			onPanResponderEnd: (event, gestureState) => {
				const { dx, dy } = gestureState;
				const { top, left } = this.state;

				const scale = this.getScaleLevel();

				const computedTop = top + this.topValue;
				const computedLeft = left + this.leftValue;

				const normalizedTop = computedTop * (1 / scale);
				const normalizedLeft = computedLeft * (1 / scale);

				// console.log("computed", computedLeft, computedTop);
				// console.log("normal", normalizedLeft, normalizedTop);

				this.setState({
					top: computedTop,
					left: computedLeft
				});

				// // ---------------------------------------------------------------------
				// // POSITIVE MOTION
				// // ---------------------------------------------------------------------

				// if (dx >= 0) {
				// 	if (computedLeft > 0) {
				// 		Animated.timing(this.positionAnimatedValue, {
				// 			toValue: {
				// 				x: (deviceWidth - this.getScaledWidth(this.getInitialHeight())) / 2,
				// 				y: dy
				// 			},
				// 			duration: 450
				// 		}).start();
				// 		this.setState({
				// 			left: 0
				// 		});
				// 	}
				// }

				// if (dy > 0) {
				// 	if (normalizedTop < 0) {
				// 		Animated.timing(this.positionAnimatedValue, {
				// 			toValue: {
				// 				x: dx,
				// 				y: (deviceHeight - this.getInitialHeight()) / 2
				// 			},
				// 			duration: 450
				// 		});
				// 		this.setState({
				// 			top: 0
				// 		});
				// 	}
				// }

				// // ---------------------------------------------------------------------
				// // NEGATIVE MOTION
				// // ---------------------------------------------------------------------
				// if (dx < 0) {
				// 	if (normalizedLeft < 0) {
				// 		Animated.timing(this.positionAnimatedValue, {
				// 			toValue: {
				// 				x: (deviceWidth - this.getScaledWidth(this.getInitialHeight())) / 2,
				// 				y: dy
				// 			},
				// 			duration: 450
				// 		}).start();
				// 		this.setState({
				// 			left: 0
				// 		});
				// 	}
				// }

				// if (dy < 0) {
				// 	if (normalizedTop > 0) {
				// 		Animated.timing(this.positionAnimatedValue, {
				// 			toValue: {
				// 				x: dx,
				// 				y: (deviceHeight - this.getInitialHeight()) / 2
				// 			},
				// 			duration: 450
				// 		});
				// 		this.setState({
				// 			top: 0
				// 		});
				// 	}
				// }
			}
		});
	};

	initializeScalePanResponder = () => {
		this.scaleAnimatedValue = new Animated.Value(0);
		this.scaleRange = 0;

		this.scalePanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (event, gestureState) => {
				this.toggleIsScaling();
				// this.scaleAnimatedValue.extractOffset();
			},
			onPanResponderMove: (event, gestureState) => {
				const { dx, dy } = gestureState;
				const scaleRangeValueDelta = (this.scaleRangeMax * dx) / this.scaleRangeMax;

				this.setState({
					scaleRangeValueDelta
				});
				// console.log(dx, this.scaleRange);
				// // if (dx >= 0 && dx <= deviceWidth - 200) {
				// // 	this.scaleAnimatedValue.setValue(dx);
				// // }

				// if (this.scaleRange + dx >= 0 && this.scaleRange + dx <= range) {
				// 	this.scaleAnimatedValue.setValue(dx);
				// }
			},
			onPanResponderRelease: (event, gestureState) => {
				const { dx, dy } = gestureState;
				const { scaleRangeValue, scaleRangeValueDelta } = this.state;
				this.setState({ scaleRangeValue: scaleRangeValue + scaleRangeValueDelta, scaleRangeValueDelta: 0 });
				this.toggleIsScaling();

				// console.log(dx);
				// if (this.scaleRange + dx >= 0 && this.scaleRange + dx <= range) {
				// 	this.scaleRange = this.scaleRange + dx;
				// }
			}
		});
	};

	toggleIsScaling = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		this.setState({ isScaling: !this.state.isScaling });
	};

	getScaleLevel = () => {
		const { scaleRangeValue, scaleRangeValueDelta } = this.state;
		const cappedValue = this.getScaleRangeCappedValue(scaleRangeValue + scaleRangeValueDelta);
		return parseFloat(
			interpolate(cappedValue, {
				inputRange: [0, this.scaleRangeMax],
				outputRange: [1, 2]
			}).toString()
		);
	};

	render() {
		const { isScaling, scaleRangeValue, scaleRangeValueDelta } = this.state;
		const cappedValue = this.getScaleRangeCappedValue(scaleRangeValue + scaleRangeValueDelta);

		return (
			<View style={styles.container}>
				<Animated.View
					style={[
						styles.viewport,
						{
							height: this.getInitialHeight(),
							width: this.getScaledWidth(this.getInitialHeight()),
							// top,
							// left
							// transform: [{ scale: this.scaleAnimatedValue }]
							transform: [
								{
									scale: this.getScaleLevel()
								}
							]
						},
						this.positionAnimatedValue.getLayout()
					]}
					{...this.positionPanResponder.panHandlers}>
					<Image style={styles.viewportImage} source={{ uri: "https://cdn.dribbble.com/users/94953/screenshots/3189793/cameraicons.png" }} />
				</Animated.View>
				<View style={styles.cropper} pointerEvents="none" />
				<Button title="Crop" onPress={this.getCropOffset} />
				<View style={{ width: 114.25, height: 114.25, backgroundColor: "green", position: "absolute", top: 0, zIndex: 5 }} />
				<View style={styles.controls}>
					<View style={styles.controlsDotInner}>
						<View style={styles.controlsMinDot} />
						<View style={styles.controlsDotTrack}>
							<Animated.View
								style={[
									styles.controlsDot,
									{
										transform: [{ scale: isScaling ? 1.3 : 1 }],
										left: cappedValue
									}
								]}
								{...this.scalePanResponder.panHandlers}
							/>
						</View>
						<View style={styles.controlsMaxDot} />
					</View>
				</View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#11161f",
		justifyContent: "space-between"
	} as ImageStyle,
	viewport: {
		position: "absolute"
	} as ViewStyle,
	viewportImage: {
		width: "100%",
		height: "100%",
		resizeMode: "cover"
	} as ImageStyle,
	cropper: {
		position: "absolute",
		width: cropperWidth,
		height: cropperHeight,
		borderRadius: 7,
		top: cropperPositionTop,
		left: cropperPositionLeft,
		borderWidth: 2.5,
		borderStyle: "dashed",
		borderColor: "white",
		backgroundColor: "rgba(0,0,0,0.2)"
	} as ViewStyle,
	controls: {
		height: 72,
		width: "100%",
		paddingHorizontal: 50,
		backgroundColor: "black"
	} as ViewStyle,
	controlsDotInner: {
		flexDirection: "row",
		justifyContent: "space-between",
		height: "100%",
		position: "relative",
		alignItems: "center",
		width: "100%"
	} as ViewStyle,
	controlsDotTrack: {
		height: "100%",
		flex: 1,
		marginHorizontal: 20,
		justifyContent: "center"
	} as ViewStyle,
	controlsDot: {
		borderRadius: 12,
		width: 24,
		height: 24,
		borderWidth: 1,
		backgroundColor: "#48a0ec",
		position: "absolute"
	} as ViewStyle,
	controlsMinDot: {
		borderRadius: 6,
		width: 12,
		height: 12,
		borderWidth: 1,
		borderColor: "white"
	} as ViewStyle,
	controlsMaxDot: {
		borderRadius: 12,
		width: 24,
		height: 24,
		borderWidth: 1,
		borderColor: "white"
	} as ViewStyle
});
