import {Text, View, Pressable, Image, StyleSheet} from 'react-native';
import { router } from 'expo-router';

export default function onboarding4(){
    return(
        <View style={onboardingStyle.container}>
            <View style={onboardingStyle.circleShape}/>
            <Image source={require('../../../assets/onboarding/Plan.png')} 
                resizeMode='contain'  
                style={{width: 330, height: 330, position: "absolute",  top: 150, left: -110, transform: [{rotate: "35deg"}]}}
                />
            <Image source={require('../../../assets/onboarding/dog.png')} 
                resizeMode='contain'  
                style={{width: 310, height: 310, position: "absolute",  top: 300, right: -120, transform: [{rotate: "-0deg"}]}}
                />

                {/* navigation */}
                <View style={{flexDirection: "row", justifyContent: "center", marginTop: 70, gap: 5}}>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#247e41", width: 15, height: 15, borderRadius: 55}}></View>
                </View>


            <View style={onboardingStyle.container2}>
                <Text style={onboardingStyle.titleText}>Every Classmates Matters</Text>
                <Text style={onboardingStyle.descText}>Learn from each other. share{'\n'}knowledge and make your school{'\n'}community stronger </Text>
            </View>

            {/* Buttons */}
            <View style={onboardingStyle.allButtons}>
                <Pressable>
                    <Text style={onboardingStyle.backButton} onPress={() => router.push('/onboarding/onboarding3')}>Back</Text>
                </Pressable>

                <Pressable>
                    <Text style={onboardingStyle.nextButton} onPress={() => router.push('/onboarding/get-started')}>Next</Text>
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

    circleShape: {
        backgroundColor: "#FFF3E0",
        height: "30%",
        width: "100%",
        borderRadius: "50%",
        position: "absolute",
        bottom: -100,

    },

    container2: {
        flex: 1,
        justifyContent: "flex-end",
        paddingHorizontal: 20,
        paddingBottom: 170,
    },

    titleText: {
        fontSize: 25,
        fontWeight: 800,
        color: "#FFFFFF",
    },

    descText: {
        color: "#FFFFFF",
        fontWeight: 400,
    },

    allButtons: {
        flexDirection: 'row',
        gap: 40,
        justifyContent: "center",
        marginVertical: 50,
    },

    backButton: {
        backgroundColor: "#E3DED5",
        borderWidth: 1,
        paddingHorizontal: 45,
        borderRadius: 15,
        paddingVertical: 10,
    },

    nextButton: {
        backgroundColor: "#3ab862",
        borderWidth: 1,
        paddingHorizontal: 45,
        borderRadius: 15,
        paddingVertical: 10,
        color: "white",
    },
})