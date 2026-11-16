import { View, StyleSheet, Pressable, Image, Text} from 'react-native';
import { router } from 'expo-router';

export default function getStarted(){
    return(
        <View style={onboardingStyle.container}>
            <View style={onboardingStyle.circleShape}/>
            <View>
                <Image source={require('../../../assets/onboarding/getStarted.png')} 
                resizeMode='contain'  
                style={{width: 270, height: 270, position: "absolute", left: 75, top: 250}}
                />
            </View>
            <View style={onboardingStyle.container2}>
                <Text style={onboardingStyle.titleText}>Get Started!</Text>
                <Text style={onboardingStyle.descText}>Share. Connect Learn. All in{'\n'}one place.</Text>
            </View>

            {/* Buttons */}
           
            {/* Buttons */}
            <View style={onboardingStyle.allButtons}>
            <Pressable
                onPress={() => router.push('/users/signup')}
                style={onboardingStyle.signupButton}
            >
                <Text style={{ fontWeight: 'bold', color: '#000000' }}>
                Sign up
                </Text>
            </Pressable>

            <Pressable
                onPress={() => router.push('/users/login')}
                style={onboardingStyle.loginButton}
            >
                <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                Log in
                </Text>
            </Pressable>
            </View>

        </View>
    )
}

const onboardingStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#3ab862",
    },

    container2: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 130,
    },

    circleShape: {
        backgroundColor: "#FFF3E0",
        height: "30%",
        width: "100%",
        borderRadius: "50%",
        position: "absolute",
        bottom: -100,

    },

    allButtons: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 15,
        marginVertical: -80,
    },

    titleText: {
        fontSize: 45,
        fontWeight: 500,
        color: "#FFFFFF",
    },

    descText: {
        color: "#FFFFFF",
        fontWeight: 400,
        textAlign: "center",
    },
    
    signupButton: {
        backgroundColor: "#E3DED5",
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 120,
        paddingVertical: 10,
        fontWeight: "bold",
    },

    loginButton:{
        backgroundColor: "#3ab862",
        borderWidth: 1,
        paddingHorizontal: 125,
        borderRadius: 15,
        paddingVertical: 10,
        color: "white",
        fontWeight: "bold",
    },

})