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
	ImageEditor,
	ImageStore,
	UIManager,
	LayoutAnimation,
	Text,
	TouchableOpacity,
	TextStyle,
	RegisteredStyle
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

interface IImageCropperProps {
	imageURL: string;
	imageWidth: number;
	imageHeight: number;
	accentColor?: string;
	toolBarTextStyle?: RegisteredStyle<ViewStyle> | ViewStyle;
}

interface IImageCropperState {
	top: number;
	left: number;
	scaleRangeValue: number;
	scaleRangeValueDelta: number;
	isScaling: boolean;
}

// -----------------------------------------------------------------
// ENABLE LAYOUTANIMATION
// -----------------------------------------------------------------
UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

export class ImageCropper extends React.PureComponent<IImageCropperProps, IImageCropperState> {
	/**
	 *
	 */
	constructor(props: Readonly<IImageCropperProps>) {
		super(props);

		this.state = {
			top: (deviceHeight - this.getInitialHeight()) / 2,
			left: (deviceWidth - this.getScaledWidth(this.getInitialHeight())) / 2,
			scaleRangeValue: this.defaultScale,
			scaleRangeValueDelta: 0,
			isScaling: false
		} as IImageCropperState;
	}

	positionPanResponder: PanResponderInstance;
	scalePanResponder: PanResponderInstance;

	positionAnimatedValue: Animated.ValueXY;

	topValue: number;
	leftValue: number;

	scaleRangeMin: number = 0;
	scaleRangeMax: number = deviceWidth - 188;

	defaultScale = this.scaleRangeMax / 2;

	getImageAspectRatio = () => {
		return imageWidth / imageHeight;
	};

	getScaledWidth = (targetHeight: number) => {
		const aspectRatio = this.getImageAspectRatio();
		return aspectRatio * targetHeight;
	};

	getInitialHeight = () => {
		return cropperHeight;
	};

	calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
		let dx = Math.abs(x1 - x2);
		let dy = Math.abs(y1 - y2);
		return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	};

	normalizeSizeX = (value: number) => {
		const scale = this.getScaleLevel();
		return ((value / this.getScaledWidth(this.getInitialHeight())) * 800) / scale;
	};

	normalizeSizeY = (value: number) => {
		const scale = this.getScaleLevel();
		return ((value / this.getInitialHeight()) * 600) / scale;
	};

	normalizeScaleX = (value: number) => {
		const scale = this.getScaleLevel();
		return value - (scale - 1) * (this.getScaledWidth(this.getInitialHeight()) / 4);
	};

	normalizeScaleY = (value: number) => {
		const scale = this.getScaleLevel();
		return value - (scale - 1) * (this.getInitialHeight() / 4);
	};

	normalizePositionX = (value: number) => {
		const scale = this.getScaleLevel();
		return value - (scale - 1) * this.getScaledWidth(this.getInitialHeight()) * 0.5;
	};

	normalizePositionY = (value: number) => {
		const scale = this.getScaleLevel();
		return value - (scale - 1) * this.getInitialHeight() * 0.5;
	};

	getScaleRangeCappedValue = (value: number) => {
		if (value <= this.scaleRangeMin) return this.scaleRangeMin + 1;
		if (value >= this.scaleRangeMax) return this.scaleRangeMax;

		return value;
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

	getScaleMarkingsArray = () => {
		const count = Math.round((deviceWidth - 94) / 40);
		return new Array(5).fill(null);
	};

	toggleIsScaling = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		this.setState({ isScaling: !this.state.isScaling });
	};

	componentDidMount = () => {
		// imageWidth = this.props.imageWidth;
	};

	componentWillMount = () => {
		this.initializePositionPanResponder();
		this.initializeScalePanResponder();
	};

	initializePositionPanResponder = () => {
		this.positionAnimatedValue = new Animated.ValueXY({
			x: (deviceWidth - this.getScaledWidth(this.getInitialHeight())) / 2,
			y: (deviceHeight - this.getInitialHeight()) / 2
		});
		this.positionPanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (e, g) => {
				this.positionAnimatedValue.extractOffset();
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
			},
			onPanResponderEnd: (event, gestureState) => {
				const { top, left } = this.state;

				const computedTop = top + this.topValue;
				const computedLeft = left + this.leftValue;

				this.setState({
					top: computedTop,
					left: computedLeft
				});
			}
		});
	};

	initializeScalePanResponder = () => {
		this.scalePanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (event, gestureState) => {
				this.toggleIsScaling();
			},
			onPanResponderMove: (event, gestureState) => {
				const { dx } = gestureState;
				const scaleRangeValueDelta = (this.scaleRangeMax * dx) / this.scaleRangeMax;
				this.setState({
					scaleRangeValueDelta
				});
			},
			onPanResponderRelease: (event, gestureState) => {
				const { scaleRangeValue, scaleRangeValueDelta } = this.state;
				this.setState({ scaleRangeValue: scaleRangeValue + scaleRangeValueDelta, scaleRangeValueDelta: 0 });
				this.toggleIsScaling();
			}
		});
	};

	cropImage = () => {
		const { top, left } = this.state;
		const normalizedTop = this.normalizePositionY(top);
		const normalizedLeft = this.normalizePositionX(left);
		const distanceX = this.calculateDistance(normalizedLeft, 0, cropperPositionLeft, 0);
		const distanceY = this.calculateDistance(0, normalizedTop, 0, cropperPositionTop);
		const offset = {
			x: this.normalizeSizeX(distanceX),
			y: this.normalizeSizeY(distanceY),
			width: this.normalizeSizeX(cropperWidth),
			height: this.normalizeSizeY(cropperHeight)
		};

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
				<View style={styles.cropper} pointerEvents="none">
					{new Array(2).fill(null).map((o, i) => (
						<View key={i} style={[styles.cropperGridline, styles.cropperGridlineVertical]} />
					))}
					{new Array(2).fill(null).map((o, i) => (
						<View key={i} style={[styles.cropperGridline, styles.cropperGridlineHorizontal, { top: (i + 1) * 33 + "%" }]} />
					))}
				</View>
				<View style={styles.toolBar}>
					<TouchableOpacity onPress={this.cropImage}>
						<Text style={styles.toolBarText}>Apply</Text>
					</TouchableOpacity>
				</View>
				{/* <Button title="Crop" onPress={this.cropImage} /> */}
				<View style={styles.controls}>
					<View style={styles.controlsDotInner}>
						<View style={styles.controlsMinDot} />
						<View style={styles.controlsDotTrack}>
							{this.getScaleMarkingsArray().map((o, i) => (
								<View key={i} style={styles.controlsScaleMarking} />
							))}
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
		borderRadius: 12,
		top: cropperPositionTop,
		left: cropperPositionLeft,
		borderWidth: 2,
		borderStyle: "dashed",
		borderColor: "white",
		backgroundColor: "rgba(0,0,0,0.2)",
		flexDirection: "row",
		justifyContent: "space-evenly"
	} as ViewStyle,
	cropperGridline: {
		opacity: 0.1,
		backgroundColor: "white"
	} as ViewStyle,
	cropperGridlineVertical: {
		width: 1,
		height: cropperHeight
	} as ViewStyle,
	cropperGridlineHorizontal: {
		width: cropperWidth,
		position: "absolute",
		left: 0,
		height: 1
	} as ViewStyle,
	toolBar: {
		height: 48,
		width: "100%",
		paddingHorizontal: 40,
		justifyContent: "flex-end",
		backgroundColor: "#48a0ec",
		alignItems: "center",
		flexDirection: "row"
	} as ViewStyle,
	toolBarTextTouchArea: {
		marginLeft: 30
	} as ViewStyle,
	toolBarText: {
		color: "white"
	} as TextStyle,
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
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: 20,
		justifyContent: "space-around"
	} as ViewStyle,
	controlsDot: {
		borderRadius: 12,
		width: 24,
		height: 24,
		borderColor: "white",
		borderWidth: 1.5,
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
	} as ViewStyle,
	controlsScaleMarking: {
		width: 4,
		height: 8,
		backgroundColor: "white",
		borderRadius: 2
	} as ViewStyle
});
