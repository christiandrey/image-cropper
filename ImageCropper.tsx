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
	ImageStore
} from "react-native";

const deviceWidth = Dimensions.get("screen").width;
const deviceHeight = Dimensions.get("screen").height;

const imageWidth = 800;
const imageHeight = 600;

interface IImageCropperState {
	top: number;
	left: number;
	scale: number;
}

export class ImageCropper extends React.PureComponent<{}, IImageCropperState> {
	/**
	 *
	 */
	constructor(props: Readonly<{}>) {
		super(props);

		this.state = {
			top: (deviceHeight - this.getInitialHeight()) / 2,
			left: (deviceWidth - this.getScaledWidth(this.getInitialHeight())) / 2,
			scale: 1
		} as IImageCropperState;
	}
	positionPanResponder: PanResponderInstance;

	positionAnimatedValue: Animated.ValueXY;
	scaleAnimatedValue: Animated.Value;

	initialTouches: Array<NativeTouchEvent>;

	scaleValue: number;
	topValue: number;
	leftValue: number;

	getImageAspectRatio = () => {
		return imageWidth / imageHeight;
	};

	getScaledWidth = (targetHeight: number) => {
		const aspectRatio = this.getImageAspectRatio();
		return aspectRatio * targetHeight;
	};

	getInitialHeight = () => {
		// return deviceWidth * 0.75 + 100;
		return deviceWidth * 0.75;
	};

	getMultiplierDueToInitialZoom = () => {
		const scale = (this.scaleAnimatedValue as any)._value;
		// return (deviceWidth * 0.75 + 100) / (deviceWidth * 0.75);
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
		return ((value / deviceWidth) * 800) / this.getMultiplierDueToInitialZoom();
	};

	regularizeSizeY = (value: number) => {
		return ((value / deviceHeight) * 600) / this.getMultiplierDueToInitialZoom();
	};

	regularizeScaleX = (value: number) => {
		const scale = (this.scaleAnimatedValue as any)._value;
		return value - (scale - 1) * 400;
	};

	regularizeScaleY = (value: number) => {
		const scale = (this.scaleAnimatedValue as any)._value;
		return value - (scale - 1) * 300;
	};

	getCropOffset = () => {
		// GET CROPPPER COORDINATES
		const { top, left } = this.state;
		const scale = (this.scaleAnimatedValue as any)._value;
		const regularizedTop = this.regularizeScaleY(top);
		const regularizedLeft = this.regularizeScaleX(left);

		const offset = {
			x: this.regularizeSizeX(deviceWidth / 2 - deviceWidth * 0.75 * 0.5 - regularizedLeft),
			y: this.regularizeSizeY(deviceHeight / 2 - deviceWidth * 0.75 * 0.5 - regularizedTop),
			width: this.regularizeSizeX(deviceWidth * 0.75),
			height: this.regularizeSizeX(deviceWidth * 0.75)
		};
		// const offset = {
		// 	x: deviceWidth / 2 - deviceWidth * 0.75 * 0.5 - left,
		// 	y: deviceHeight / 2 - deviceWidth * 0.75 * 0.5 - top,
		// 	width: deviceWidth * 0.75,
		// 	height: deviceWidth * 0.75
		// };
		console.log("image", regularizedLeft, regularizedTop);
		console.log("cropper", deviceWidth / 2 - deviceWidth * 0.75 * 0.5, deviceHeight / 2 - deviceWidth * 0.75 * 0.5);
		console.log("scale", scale);
		console.log(offset);

		const { x, y, width, height } = offset;

		// ImageEditor.cropImage(
		// 	"https://cdn.dribbble.com/users/94953/screenshots/3189793/cameraicons.png",
		// 	{
		// 		offset: { x, y },
		// 		size: { width, height }
		// 	},
		// 	croppedImageUri => {
		// 		ImageStore.getBase64ForTag(croppedImageUri, base64ImageData => console.log(base64ImageData), error => null);
		// 	},
		// 	error => null
		// );
	};

	componentWillMount = () => {
		this.positionAnimatedValue = new Animated.ValueXY({
			x: (deviceWidth - this.getScaledWidth(this.getInitialHeight())) / 2,
			y: (deviceHeight - this.getInitialHeight()) / 2
		});
		this.scaleAnimatedValue = new Animated.Value(1);
		this.positionPanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (e, g) => {
				this.positionAnimatedValue.extractOffset();
				this.scaleAnimatedValue.flattenOffset();
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

				// ---------------------------------------------------
				// PINCH TO ZOOM
				// ---------------------------------------------------

				const distance = this.calculateDistance(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
				let initialDistance;
				if (this.initialTouches.length !== 2) {
					initialDistance = deviceWidth * 0.75;
				} else {
					initialDistance = this.calculateDistance(
						this.initialTouches[0].pageX,
						this.initialTouches[0].pageY,
						this.initialTouches[1].pageX,
						this.initialTouches[1].pageY
					);
				}
				const scale = this.calculateScale(distance, initialDistance);
				this.scaleValue = scale;
				this.scaleAnimatedValue.setValue(scale);
			},
			onPanResponderEnd: (e, g) => {
				this.setState({
					top: this.state.top + this.topValue,
					left: this.state.left + this.leftValue,
					scale: this.scaleValue
				});
			}
		});
	};

	render() {
		// const { top, left } = this.state;
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
							transform: [{ scale: this.scaleAnimatedValue }]
						},
						this.positionAnimatedValue.getLayout()
					]}
					{...this.positionPanResponder.panHandlers}>
					<Image style={styles.viewportImage} source={{ uri: "https://cdn.dribbble.com/users/94953/screenshots/3189793/cameraicons.png" }} />
				</Animated.View>
				<View style={styles.cropper} pointerEvents="none" />
				<Button title="Crop" onPress={this.getCropOffset} />
				<View style={styles.controls}>
					<View style={styles.controlsMinDot} />
					<View style={styles.controlsDot} />
					<View style={styles.controlsMaxDot} />
				</View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "grey",
		justifyContent: "space-between"
	} as ImageStyle,
	viewport: {
		position: "absolute",
		width: "100%",
		height: "100%"
	} as ViewStyle,
	viewportImage: {
		width: "100%",
		height: "100%",
		resizeMode: "cover"
	} as ImageStyle,
	cropper: {
		position: "absolute",
		width: deviceWidth * 0.75,
		height: deviceWidth * 0.75,
		borderRadius: 7,
		top: deviceHeight / 2 - deviceWidth * 0.75 * 0.5,
		left: deviceWidth / 2 - deviceWidth * 0.75 * 0.5,
		borderWidth: 2.5,
		borderStyle: "dashed",
		borderColor: "white",
		backgroundColor: "rgba(0,0,0,0.2)"
	} as ViewStyle,
	controls: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 50,
		position: "relative",
		height: 72,
		width: "100%",
		backgroundColor: "black"
	} as ViewStyle,
	controlsDot: {
		borderRadius: 12,
		width: 24,
		height: 24,
		borderWidth: 1,
		backgroundColor: "#48a0ec"
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
