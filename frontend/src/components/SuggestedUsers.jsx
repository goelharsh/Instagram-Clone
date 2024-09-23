import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import axios from 'axios';
import { toast } from 'sonner';
const baseurl = import.meta.env.VITE_APP_BASE_URL

const SuggestedUsers = () => {
    const { suggestedUsers } = useSelector(store => store.auth);
    const { user } = useSelector((store) => store.auth);
    const followKrneWala = user._id;

    const followHandler = async (id) => {
        try {
          const res = await axios.post(`${baseurl}/user/followOrUnfollow/${id}`, {followKrneWala}, {withCredentials:true});
          if(res.data.success){
              toast.success(res.data.message);
          }
      } catch (error) {
          console.log(error);
      }
      };
    return (
        <div className='my-10'>
            <div className='flex items-center justify-between text-sm'>
                <h1 className='font-semibold text-gray-600'>Suggested for you</h1>
                <span className='font-medium cursor-pointer'>See All</span>
            </div>
            {
                suggestedUsers.map((user) => {
                    return (
                        <div key={user._id} className='flex items-center justify-between my-5'>
                            <div className='flex items-center gap-2'>
                                <Link to={`/profile/${user?._id}`}>
                                    <Avatar>
                                        <AvatarImage src={user?.profilePicture} alt="post_image" />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div>
                                    <h1 className='font-semibold text-sm'><Link to={`/profile/${user?._id}`}>{user?.username}</Link></h1>
                                    <span className='text-gray-600 text-sm'>{user?.bio || 'Bio here...'}</span>
                                </div>
                            </div>
                            <span className='text-[#3BADF8] text-xs font-bold cursor-pointer hover:text-[#3495d6]' onClick={()=>followHandler(user._id)}>Follow</span>
                        </div>
                    )   
                })
            }

        </div>
    )
}

export default SuggestedUsers