import {View,Text,Image,Pressable,StyleSheet,ScrollView,ActivityIndicator,Alert,TextInput} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function adminUserPage(){
    return(
        <View>
            {/* Navbar */}
            <View style={styles.navbar}>
                <View>
                    <Image
                        source={require('../../assets/signup/arrow-2.png')}
                        style={{ width: 40, height: 40 }}
                    />
                </View>
                <Text style={{fontSize: 25}}>Users</Text>
            </View>

            {/* Search bar */}
            <View>
                <View style={styles.searchContainer}>
                    <Image style={styles.searchIcon} source={require('../../assets/admin-icons/search.png')}/>
                    <TextInput style={styles.searchInput}  placeholder='Search Users...'/>
                </View> 
            </View>

            {/* CONTAINER BOX USERS */}
            <View>
                <View>
                    <View>
                        <View style={{backgroundColor: '#888', height: 50, width: 50, borderRadius: 55}}></View>
                        <View>
                            <Text>User 1 Name</Text>
                            <Text>User email</Text>
                            <Text>User Program</Text>
                        </View>
                        <View>
                            <Image source={require('../../assets/admin-icons/right-arrow.png')} style={{width: 50, height: 50}}/>
                        </View>
                    </View>
                </View>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
    },
    navbar: {
        marginTop: 60,
        marginHorizontal: 30,
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    searchContainer:{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        margin: 20,
        marginHorizontal: 25,
    },

    searchIcon:{
        width: 22,
        height: 22,
        marginRight: 10,
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        paddingVertical: 0,
    },

    userContainerBox:{
        flexDirection: 'row',
    },
})